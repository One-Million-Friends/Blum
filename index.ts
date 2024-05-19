import { BunRuntime } from '@effect/platform-bun'
import chalk from 'chalk'
import { Config, ConfigProvider, Effect, pipe, Schedule } from 'effect'
import { constVoid } from 'effect/Function'
import { balance, dropGameClaim, dropGameStart, farmingClaim, farmingStart, login } from './game/api.ts'
import { fmt } from './game/fmt.ts'
import { Telegram } from './telegram/client.ts'

type State = {
	token: string
	passes: number
	balance: number
	farming: boolean
}

const miner = Effect.gen(function* (_) {
	const client = yield* _(Telegram)
	const peerId = yield* _(client.getPeerId('BlumCryptoBot'))

	const webViewResultUrl = yield* _(
		client.requestWebView({
			url: 'https://telegram.blum.codes/',
			bot: peerId,
			peer: peerId,
		})
	)

	const tgWebAppData = webViewResultUrl.searchParams.get('tgWebAppData')!
	if (!tgWebAppData) {
		return Effect.none
	}

	const state: State = {
		token: '',
		passes: 0,
		balance: 0,
		farming: false,
	}

	const sync = Effect.gen(function* (_) {
		const { token } = yield* login(tgWebAppData)
		state.token = token.access

		const result = yield* balance(state.token)
		state.passes = result.playPasses
		state.balance = result.availableBalance
		state.farming = result.farming.endTime > new Date()
	})

	const mine = Effect.gen(function* (_) {
		if (state.farming) {
			return
		}

		const { availableBalance, playPasses } = yield* farmingClaim(state.token)
		const balanceDiff = availableBalance - state.balance

		state.passes = playPasses
		state.balance = availableBalance

		yield* farmingStart(state.token)
		state.farming = true

		console.log(
			chalk.bold(new Date().toLocaleTimeString()),
			'|🪙'.padEnd(4),
			chalk.bold(fmt(state.balance).slice(1).padEnd(8)),
			chalk.bold[balanceDiff > 0 ? 'green' : 'red'](fmt(balanceDiff).padEnd(4))
		)
	})

	const drop = Effect.gen(function* (_) {
		if (state.passes <= 0) {
			return
		}

		const { gameId } = yield* dropGameStart(state.token)
		yield* Effect.sleep('31 seconds')
		yield* dropGameClaim(state.token, gameId, 300)
	})

	const mineInterval = yield* Config.duration('GAME_MINE_INTERVAL').pipe(Config.withDefault('10 seconds'))
	const syncInterval = yield* Config.duration('GAME_SYNC_INTERVAL').pipe(Config.withDefault('60 seconds'))

	const miner = Effect.repeat(mine, Schedule.fixed(mineInterval))
	const syncer = Effect.schedule(sync, Schedule.fixed(syncInterval))
	const dropper = Effect.repeat(drop, Schedule.fixed(mineInterval))

	yield* sync

	console.log(
		chalk.bold(new Date().toLocaleTimeString()),
		'|🪙'.padEnd(4),
		chalk.bold(fmt(state.balance).slice(1).padEnd(8))
	)

	yield* Effect.all([miner, syncer, dropper], { concurrency: 'unbounded' })
})

const policy = Schedule.fixed('15 seconds')

const program = Effect.match(miner, {
	onSuccess: constVoid,
	onFailure: (err) => {
		console.error(chalk.bold(new Date().toLocaleTimeString()), '‼️FAILED:', err._tag)
	},
})

pipe(
	Effect.all([Effect.repeat(program, policy), Effect.sync(() => process.stdout.write('\u001Bc\u001B[3J'))], {
		concurrency: 'unbounded',
	}),
	Effect.provide(Telegram.live),
	Effect.withConfigProvider(ConfigProvider.fromEnv()),
	BunRuntime.runMain
)
