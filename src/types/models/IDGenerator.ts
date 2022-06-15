// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type IDGeneratorProps = Omit<IDGenerator, NonNullable<FunctionPropertyNames<IDGenerator>>>;

export class IDGenerator implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public aID: bigint;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save IDGenerator entity without an ID");
        await store.set('IDGenerator', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove IDGenerator entity without an ID");
        await store.remove('IDGenerator', id.toString());
    }

    static async get(id:string): Promise<IDGenerator | undefined>{
        assert((id !== null && id !== undefined), "Cannot get IDGenerator entity without an ID");
        const record = await store.get('IDGenerator', id.toString());
        if (record){
            return IDGenerator.create(record as IDGeneratorProps);
        }else{
            return;
        }
    }



    static create(record: IDGeneratorProps): IDGenerator {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new IDGenerator(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
