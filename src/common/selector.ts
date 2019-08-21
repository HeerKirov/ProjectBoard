export interface Field {
    name: string        //展示在read内容的field name
    field?: string       //记录在model的field name，默认值是name的值
    readonly?: boolean       //仅可读，默认false
    writeonly?: boolean      //仅可写，默认false
    required?: boolean   //必须字段。在非partial的setter中，要求必须存在一个值或默认值。write配置选项之一。默认true。
    default?: any | (() => any)    //默认值。在非partial的setter中，如果值不存在则使用此值或生成值。write配置选项之一。默认undefined。
    nullable?: boolean   //允许此字段的值为null。write配置选项之一。默认false。
    readAs?: (any) => any   //设定此字段，则会在read时对每一个选项实行转换。
    writeAs?: (any) => any  //设定此字段，则会在write时对每一个选项进行转换。
    onlyOnDetail?: boolean  //仅在detail系操作中展示的字段。
}

function transferStandardField(f: string | Field): Field {
    if(typeof f === 'string') {
        return {name: f, field: f, readonly: false, writeonly: false, required: true, nullable: false}
    }else{
        if(f.field === undefined) f.field = f.name
        if(f.readonly == undefined) f.readonly = false
        if(f.writeonly == undefined) f.writeonly = false
        if(f.required == undefined) f.required = true
        if(f.nullable == undefined) f.nullable = false
        if(f.onlyOnDetail == undefined) f.onlyOnDetail = false
        return f
    }
}

export class Selector {
    private readonly selectFieldList: string
    private readonly fields: Field[]
    private readonly rFields: Field[]
    private readonly wFields: Field[]
    constructor(fields: (string | Field)[]) {
        this.fields = fields.map(f => transferStandardField(f))
        this.rFields = this.fields.filter(f => !f.writeonly)
        this.wFields = this.fields.filter(f => !f.readonly)
        this.selectFieldList = this.rFields.map(f => f.field).join(' ')
    }

    /**
     * 返回一个使用在mongoose select语句中的字段列表，给出可以被read的字段的列表。
     */
    selectFields(): string {
        return this.selectFieldList
    }

    /**
     * 从obj里过滤出selector显式记录的fields。
     * @param obj
     * @param detail
     */
    readFields(obj: any, detail: boolean = false): any {
        let ret = {}
        for(let field of this.rFields) {
            if(field.field in obj && (detail || !field.onlyOnDetail)) {
                if(field.readAs) ret[field.name] = field.readAs(obj[field.field])
                else ret[field.name] = obj[field.field]
            }
        }
        return ret
    }

    /**
     * 根据selector的fields，从params里挑出来，并为document赋值。返回setter集合。返回undefined时表示未成功。
     * @param params
     * @param partial
     */
    writeFields<T extends Document>(params: any, partial: boolean = false): any | undefined {
        let setter = {}
        for(let field of this.wFields) {
            if(field.name in params) {
                if(params[field.name] === null && !field.nullable) return undefined
                let value = field.writeAs ? field.writeAs(params[field.name]) : params[field.name]
                if(value === undefined) return undefined
                setter[field.field] = value
            }else if(field.default !== undefined) {
                if(typeof field.default === 'function') setter[field.field] = field.default()
                else setter[field.field] = field.default
            }else if(!partial && field.required) {
                return undefined
            }
        }
        return setter
    }

    static notBlank(obj: any) : any {
        return obj || undefined
    }
}