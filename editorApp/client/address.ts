import { Component } from "./components/component";

export interface Addressable {
    id(): string;
    addressParent(): Addressable | null;
    addressChild(id: string): Addressable | null | undefined;
}

export const roots = new Map<string, Addressable>();

export function addAddressRoot(r: Addressable) {
    if (roots.has(r.id())) {
        throw new Error(`address root "${r.id()}" already exists`);
    }
    roots.set(r.id(), r);
}

export function removeAddressRoot(id: string) {
    console.log('remove address root', id)
    if (!roots.has(id)) {
        console.error(`address root "${id}" does not exist`);
        return;
    }
    roots.delete(id);
}

interface typeMap { // for mapping from strings to types
    string: string;
    number: number;
    boolean: boolean;
}

type PrimitiveOrConstructor = // 'string' | 'number' | 'boolean' | constructor
    | { new(...args: any[]): any }
    | keyof typeMap;

// infer the guarded type from a specific case of PrimitiveOrConstructor
type GuardedType<T extends PrimitiveOrConstructor> = T extends { new(...args: any[]): infer U; } ? U : T extends keyof typeMap ? typeMap[T] : never;

function typeGuard<T extends PrimitiveOrConstructor>(o: any, className: T):
    o is GuardedType<T> {
    const localPrimitiveOrConstructor: PrimitiveOrConstructor = className;
    if (typeof localPrimitiveOrConstructor === 'string') {
        return typeof o === localPrimitiveOrConstructor;
    }
    return o instanceof localPrimitiveOrConstructor;
}


export function getTypedByAddress<T>(q: { new(...args: any[]): T }, address?: string): T | null {
    let t = getByAddress(address);
    if (typeGuard(t, q)) return t as T;
    console.error(t, 'is not an instance of', q);
    return null;
}

export function getByAddress(address?: string): any | null {
    if (address == null) {
        console.error('passed address is null', address);
        return null;
    }
    const parts = address.split(':');
    let t: Addressable | null | undefined = roots.get(parts[0]);
    if (t == null) {
        console.error('address root', parts[0], 'not found', address);
    }
    for (let i = 1; i < parts.length && t != null; i++) {
        t = t.addressChild(parts[i]);
        if (t == null) {
            console.error('address child', parts[i], 'not found', address);
        }
    }
    if (t === undefined) return null;
    return t;
}

export function newAddress(p?: Component): string {
    if (p !== undefined) {
        let i = 0;
        while (p.children.has('' + i)) i++;
        return '' + i;
    }
    let i = 0;
    while (roots.has('' + i)) i++;
    return "" + i;
}

export function address(a: Addressable | null): string {
    if (a === null) return "";
    const o = a;
    let z = a.id();
    let t = a.addressParent()
    while (t != null) {
        z = t.id() + ':' + z;
        a = t;
        t = t.addressParent();
    }
    if (!roots.has(a.id())) {
        console.error('address', z, 'of', o, 'does not starts from the root');
    }
    return z;
}