import { Schema } from '@effect/schema'
import { type Annotable, DateFromSelf, transform } from '@effect/schema/Schema'

export interface DateFromTime extends Annotable<DateFromTime, Date, number> {}

export const DateFromTime: DateFromTime = transform(Schema.Number, DateFromSelf, {
	decode: (s) => new Date(s),
	encode: (n) => n.getTime(),
}).annotations({ identifier: 'DateFromTime' })

export const Login = Schema.Struct({
	token: Schema.Struct({
		access: Schema.String,
		refresh: Schema.String,
	}),
})

export const Balance = Schema.Struct({
	availableBalance: Schema.NumberFromString,
	playPasses: Schema.Number,
	timestamp: DateFromTime,
	farming: Schema.Struct({
		startTime: DateFromTime,
		endTime: DateFromTime,
		earningsRate: Schema.NumberFromString,
		balance: Schema.NumberFromString,
	}),
})

export const FarmingStart = Schema.Struct({
	startTime: DateFromTime,
	endTime: DateFromTime,
	earningsRate: Schema.NumberFromString,
	balance: Schema.NumberFromString,
})

export const FarmingClaim = Schema.Struct({
	availableBalance: Schema.NumberFromString,
	playPasses: Schema.Number,
	timestamp: DateFromTime,
})

export const DropGameStart = Schema.Struct({
	gameId: Schema.String,
})
