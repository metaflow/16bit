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

export function getByAddress(address: string): Addressable|null {
    const parts = address.split(':');
    let t: Addressable|null|undefined = roots.get(parts[0]); 
    for (let i = 1; i < parts.length && t != null; i++)     {
        t = t.addressChild(parts[i]);
    }
    if (t === undefined) return null;
    return t;
}

export function address(a: Addressable|null): string {
    if (a === null) return "";
    let z = a.id();
    let t = a.addressParent()
    while (t !== null) {
        z = t.id() + ':' + z;
        t = t.addressParent();
    }
    return z;
}