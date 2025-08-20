import {DateTimeColumn, Entity, StringColumn, PrimaryColumn} from '@subsquid/typeorm-store'

@Entity()
export class PoolCreatedEvent {
    constructor(props?: Partial<PoolCreatedEvent>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @StringColumn({nullable: false})
    transactionSignature!: string

    @DateTimeColumn({nullable: false})
    timestamp!: Date

    @StringColumn({nullable: false})
    poolAccount!: string

    @StringColumn({nullable: false})
    questionId!: string

    @StringColumn({nullable: false})
    predictionEndTime!: string

    @StringColumn({nullable: false})
    bump!: string
}
