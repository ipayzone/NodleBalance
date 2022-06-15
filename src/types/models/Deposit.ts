// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type DepositProps = Omit<Deposit, NonNullable<FunctionPropertyNames<Deposit>>>;

export class Deposit implements Entity {

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
        assert(id !== null, "Cannot save Deposit entity without an ID");
        await store.set('Deposit', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Deposit entity without an ID");
        await store.remove('Deposit', id.toString());
    }

    static async get(id:string): Promise<Deposit | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Deposit entity without an ID");
        const record = await store.get('Deposit', id.toString());
        if (record){
            return Deposit.create(record as DepositProps);
        }else{
            return;
        }
    }



    static create(record: DepositProps): Deposit {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Deposit(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
