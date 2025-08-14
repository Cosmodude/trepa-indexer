import {DateTimeColumn, Entity, StringColumn, PrimaryColumn} from '@subsquid/typeorm-store'

@Entity()
export class TrepaEvent {
    constructor(props?: Partial<TrepaEvent>) {
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
    predictor!: string

    @StringColumn({nullable: false})
    poolTokenAccount!: string

    @StringColumn({nullable: false})
    predictionAccount!: string

    @StringColumn({nullable: false})
    stake!: string

    @StringColumn({nullable: false})
    feePayer!: string
}
