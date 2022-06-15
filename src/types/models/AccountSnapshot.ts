// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type AccountSnapshotProps = Omit<AccountSnapshot, NonNullable<FunctionPropertyNames<AccountSnapshot>>>;

export class AccountSnapshot implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public accountId: string;

    public snapshotAtBlock: bigint;

    public freeBalance: bigint;

    public reserveBalance: bigint;

    public totalBalance: bigint;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save AccountSnapshot entity without an ID");
        await store.set('AccountSnapshot', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove AccountSnapshot entity without an ID");
        await store.remove('AccountSnapshot', id.toString());
    }

    static async get(id:string): Promise<AccountSnapshot | undefined>{
        assert((id !== null && id !== undefined), "Cannot get AccountSnapshot entity without an ID");
        const record = await store.get('AccountSnapshot', id.toString());
        if (record){
            return AccountSnapshot.create(record as AccountSnapshotProps);
        }else{
            return;
        }
    }



    static create(record: AccountSnapshotProps): AccountSnapshot {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new AccountSnapshot(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
