// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type ReservRepatriatedProps = Omit<ReservRepatriated, NonNullable<FunctionPropertyNames<ReservRepatriated>>>;

export class ReservRepatriated implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public blockNumber?: bigint;

    public toAccountId: string;

    public fromAccountId: string;

    public status?: string;

    public balanceChange?: bigint;

    public aid: bigint;

    public timestamp?: Date;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save ReservRepatriated entity without an ID");
        await store.set('ReservRepatriated', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove ReservRepatriated entity without an ID");
        await store.remove('ReservRepatriated', id.toString());
    }

    static async get(id:string): Promise<ReservRepatriated | undefined>{
        assert((id !== null && id !== undefined), "Cannot get ReservRepatriated entity without an ID");
        const record = await store.get('ReservRepatriated', id.toString());
        if (record){
            return ReservRepatriated.create(record as ReservRepatriatedProps);
        }else{
            return;
        }
    }



    static create(record: ReservRepatriatedProps): ReservRepatriated {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new ReservRepatriated(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
