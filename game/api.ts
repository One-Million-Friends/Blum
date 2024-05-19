import * as Http from '@effect/platform/HttpClient'
import { Effect, Schedule } from 'effect'
import { Balance, DropGameStart, FarmingClaim, FarmingStart, Login } from './models.ts'

const UA = `Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`

export const login = (tgWebAppData: string) =>
	Http.request.post('https://gateway.blum.codes/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP').pipe(
		Http.request.setHeader('User-Agent', UA),
		Http.request.setHeader('Content-Type', 'application/json'),
		Http.request.jsonBody({
			query: tgWebAppData,
		}),
		Effect.andThen(Http.client.fetchOk),
		Effect.andThen(Http.response.schemaBodyJson(Login)),
		Effect.scoped
	)

export const balance = (accessToken: string) =>
	Http.request
		.get('https://game-domain.blum.codes/api/v1/user/balance')
		.pipe(
			Http.request.setHeader('User-Agent', UA),
			Http.request.setHeader('Content-Type', 'application/json'),
			Http.request.bearerToken(accessToken),
			Http.client.fetchOk,
			Effect.andThen(Http.response.schemaBodyJson(Balance)),
			Effect.scoped
		)

export const farmingStart = (accessToken: string) =>
	Http.request.post('https://game-domain.blum.codes/api/v1/farming/start').pipe(
		Http.request.setHeader('User-Agent', UA),
		Http.request.setHeader('Content-Type', 'application/json'),
		Http.request.bearerToken(accessToken),
		Http.client.fetchOk,
		Effect.andThen(Http.response.schemaBodyJson(FarmingStart)),
		Effect.retry({
			times: 3,
			schedule: Schedule.fixed('1 seconds'),
		}),
		Effect.scoped
	)

export const farmingClaim = (accessToken: string) =>
	Http.request.post('https://game-domain.blum.codes/api/v1/farming/claim').pipe(
		Http.request.setHeader('User-Agent', UA),
		Http.request.setHeader('Content-Type', 'application/json'),
		Http.request.bearerToken(accessToken),
		Http.client.fetchOk,
		Effect.andThen(Http.response.schemaBodyJson(FarmingClaim)),
		Effect.retry({
			times: 3,
			schedule: Schedule.fixed('1 seconds'),
		}),
		Effect.scoped
	)

export const dropGameStart = (accessToken: string) =>
	Http.request.post('https://game-domain.blum.codes/api/v1/game/play').pipe(
		Http.request.setHeader('User-Agent', UA),
		Http.request.setHeader('Content-Type', 'application/json'),
		Http.request.bearerToken(accessToken),
		Http.client.fetchOk,
		Effect.andThen(Http.response.schemaBodyJson(DropGameStart)),
		Effect.retry({
			times: 3,
			schedule: Schedule.fixed('1 seconds'),
		}),
		Effect.scoped
	)

export const dropGameClaim = (accessToken: string, gameId: string, points: number) =>
	Http.request.post('https://game-domain.blum.codes/api/v1/game/claim').pipe(
		Http.request.setHeader('User-Agent', UA),
		Http.request.setHeader('Content-Type', 'application/json'),
		Http.request.bearerToken(accessToken),
		Http.request.jsonBody({
			gameId,
			points,
		}),
		Effect.andThen(Http.client.fetchOk),
		Effect.retry({
			times: 3,
			schedule: Schedule.fixed('1 seconds'),
		}),
		Effect.scoped
	)
