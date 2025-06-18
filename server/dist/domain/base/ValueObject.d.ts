interface ValueObjectProps {
    [index: string]: any;
}
export declare abstract class ValueObject<T extends ValueObjectProps> {
    protected readonly props: T;
    constructor(props: T);
    equals(valueObject?: ValueObject<T>): boolean;
}
export {};
//# sourceMappingURL=ValueObject.d.ts.map