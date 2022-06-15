// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type SlashProps = Omit<Slash, NonNullable<FunctionPropertyNames<Slash>>>;

export class Slash implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public blockNumber?: bigint;

    public accountId: string;

    public aid: bigint;

    public balanceChange?: bigint;

    public timestamp?: Date;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Slash entity without an ID");
        await store.set('Slash', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Slash entity without an ID");
        await store.remove('Slash', id.toString());
    }

    static async get(id:string): Promise<Slash | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Slash entity without an ID");
        const record = await store.get('Slash', id.toString());
        if (record){
            return Slash.create(record as SlashProps);
        }else{
            return;
        }
    }



    static create(record: SlashProps): Slash {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Slash(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
