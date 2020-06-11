export interface Addressable {
    id(newID?: string): string;
    addressParent(): Addressable|null;
    addressChild(id:string): Addressable|null|undefined;
}

const roots = new Map<string, Addressable>();

export function addAddressRoot(r: Addressable) {
    if (roots.has(r.id())) {
        throw new Error(`id ${r.id()} already in roots`);
    }
    roots.set(r.id(), r);
}

export function getByAddress(address: string): any|null {
    const parts = address.split(':');
    let t: Addressable|null|undefined = roots.get(parts[0]);
    if (t == null) {
        console.error('address root', parts[0], 'not found', address);
    }
    for (let i = 1; i < parts.length && t != null; i++)     {
        t = t.addressChild(parts[i]);
        if (t == null) {
            console.error('address child', parts[i], 'not found', address);
        }
    }
    if (t === undefined) return null;
    return t;
}

let _nextAddress = 0
export function newAddress(): string {
    _nextAddress++;
    return "" + _nextAddress;
}

export function address(a: Addressable|null): string {
    if (a === null) return "";
    let z = a.id();
    let t = a.addressParent()
    while (t != null) {
        z = t.id() + ':' + z;
        t = t.addressParent();
    }
    return z;
}