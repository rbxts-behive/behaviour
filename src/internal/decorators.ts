export type MethodDecorator<T extends Callback> = (
	target: ThisParameterType<T>,
	methodName: string,
	descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T>
