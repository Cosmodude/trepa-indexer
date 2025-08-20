import {DateTimeColumn, Entity, StringColumn, PrimaryColumn} from '@subsquid/typeorm-store'

@Entity()
export class PoolFinalizedEvent {
    constructor(props?: Partial<PoolFinalizedEvent>) {
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
    merkleRoot!: string

    @StringColumn({nullable: false})
    protocolFee!: string
}
