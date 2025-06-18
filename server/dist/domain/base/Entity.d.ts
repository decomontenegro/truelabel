export declare abstract class Entity<T> {
    protected readonly _id: string;
    protected props: T;
    constructor(props: T, id?: string);
    get id(): string;
    equals(entity?: Entity<T>): boolean;
    private isEntity;
}
//# sourceMappingURL=Entity.d.ts.map