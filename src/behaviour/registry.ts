import { event } from 'internal/event'

import { Behaviour } from './behaviour'

// -- Accessing RAW behaviour registry --

declare let shared: {
	// Stored in shared so that a Behive introspector can easily access behaviours externally.
	__Behive__BehaviourRegistry: unknown
}

export type BehaviourType<T extends Behaviour = Behaviour> = new (subject: RBXObject) => T

type BehaviourRegistry = Map<RBXObject, Map<BehaviourType, Behaviour>>
export type ReadonlyBehaviourRegistry = ReadonlyMap<RBXObject, ReadonlyMap<BehaviourType, Behaviour>>

function GetMutableBehaviourRegistry() {
	if (!(shared.__Behive__BehaviourRegistry instanceof Map)) {
		shared.__Behive__BehaviourRegistry = new Map()
	}

	return shared.__Behive__BehaviourRegistry as BehaviourRegistry
}

export function GetBehaviourRegistry(): ReadonlyBehaviourRegistry {
	return GetMutableBehaviourRegistry()
}

// -- Accessing behaviour registry --

export function GetBehaviours(instance: RBXObject): readonly Behaviour[] {
	const behaviourByType = GetBehaviourRegistry().get(instance)
	if (behaviourByType === undefined) return []

	const behaviours: Behaviour[] = []
	for (const [_, behaviour] of behaviourByType) {
		behaviours.push(behaviour)
	}

	return behaviours
}

export async function TryGetBehaviour<T extends Behaviour>(type: BehaviourType<T>, instance: T['Subject']) {
	const behaviour = GetBehaviourRegistry().get(instance)?.get(type) as T | undefined
	if (behaviour === undefined) return

	if (behaviour.GetState() !== 'started') {
		await Promise.fromEvent(behaviour.Started)
	}

	return behaviour
}

export async function GetBehaviour<T extends Behaviour>(type: BehaviourType<T>, instance: T['Subject']) {
	return (await TryGetBehaviour(type, instance)) ?? error(`Could not find a behaviour on ${debugName(instance)}`)
}

// -- Manipulating behaviour registry --

const BehaviourAddedEvent = event<[behaviour: Behaviour]>()
export const BehaviourAdded = BehaviourAddedEvent.Event

const BehaviourRemovingEvent = event<[behaviour: Behaviour]>()
export const BehaviourRemoving = BehaviourRemovingEvent.Event

export async function AddBehaviour<T extends Behaviour>(type: BehaviourType<T>, instance: T['Subject']) {
	const registry = GetMutableBehaviourRegistry()

	const behaviourByType = ensure(registry, instance, new Map())

	const behaviour = new type(instance)
	behaviourByType.set(type, behaviour)
	BehaviourAddedEvent.Fire(behaviour)

	await behaviour.Start()
	return behaviour
}

export async function RemoveBehaviour<T extends Behaviour>(type: BehaviourType<T>, instance: T['Subject']) {
	const registry = GetMutableBehaviourRegistry()

	const behaviourByType = ensure(registry, instance, new Map())
	const behaviour = behaviourByType.get(type)
	if (behaviour === undefined) return

	BehaviourRemovingEvent.Fire(behaviour)

	await behaviour.Stop()
	behaviourByType.delete(type)
}

// utils

function ensure<K, V>(map: Map<K, V>, key: K, defaultValue: V) {
	let value = map.get(key)
	if (value === undefined) {
		value = defaultValue
		map.set(key, defaultValue)
	}
	return value
}

// Return type annotation is essential here otherwise @typescript-eslint/restrict-template-expressions earlier in the code above for some reason
function debugName(instance: RBXObject): string {
	return typeIs(instance, 'Instance') ? instance.GetFullName() : instance.ClassName
}
