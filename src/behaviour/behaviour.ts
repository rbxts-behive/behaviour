import { event } from 'internal/event'

export abstract class Behaviour {
	protected constructor(subject: RBXObject) {
		this.Subject = subject
	}

	readonly Subject: RBXObject

	private __state: BehaviourState = 'idle'

	private readonly StateChangedEvent = event<[state: BehaviourState]>()
	readonly StateChanged = this.StateChangedEvent.Event

	private readonly StartingEvent = event<[]>()
	readonly Starting = this.StartingEvent.Event

	private readonly StartedEvent = event<[]>()
	readonly Started = this.StartedEvent.Event

	private readonly StoppingEvent = event<[]>()
	readonly Stopping = this.StoppingEvent.Event

	private readonly StoppedEvent = event<[]>()
	readonly Stopped = this.StoppedEvent.Event

	protected OnStart?(): Promise<void>
	protected OnStop?(): Promise<void>

	private SetState(state: BehaviourState) {
		this.__state = state
		this.StateChangedEvent.Fire(state)

		switch (state) {
			case 'idle':
				break

			case 'starting':
				this.StartingEvent.Fire()
				break

			case 'started':
				this.StartedEvent.Fire()
				break

			case 'stopping':
				this.StoppingEvent.Fire()
				break

			case 'stopped':
				this.StoppedEvent.Fire()
				break

			default:
				state satisfies never
		}
	}

	GetState() {
		return this.__state
	}

	async Start() {
		this.SetState('starting')
		await Promise.try(() => this.OnStart?.())

		this.SetState('started')
	}

	async Stop() {
		if (this.__state === 'stopped') return
		if (this.__state !== 'started') await Promise.fromEvent(this.Started)

		this.SetState('stopping')
		await Promise.try(() => this.OnStop?.())

		this.SetState('stopped')
	}
}

export type BehaviourState = 'idle' | 'starting' | 'started' | 'stopping' | 'stopped'
