import { MethodDecorator } from 'internal/decorators'
import { resolveValue, ValueOrCallback } from 'internal/value-or-callback'

import { Behaviour } from './behaviour'

export function On<Params extends unknown[]>(
	signal: RBXScriptSignal<(...params: Params) => void>,
): MethodDecorator<(this: Behaviour, ...params: Params) => Promise<void>>

export function On<This extends Behaviour, Params extends unknown[]>(
	signalFactory: (subject: This['Subject']) => RBXScriptSignal<(...params: Params) => void>,
): MethodDecorator<(this: This, ...params: Params) => Promise<void>>

export function On<This extends Behaviour, Params extends unknown[]>(
	input: ValueOrCallback<RBXScriptSignal<(...params: Params) => void>, [subject: This['Subject']]>,
) {
	return (
		target: This,
		_: string,
		descriptor: TypedPropertyDescriptor<(this: This, ...params: Params) => Promise<void>>,
	) => {
		const signal = resolveValue(input, target.Subject)
		const connection = signal.Connect((...args: Params) => descriptor.value(target, ...args))

		target.Stopping.Connect(() => connection.Disconnect())

		return descriptor
	}
}
