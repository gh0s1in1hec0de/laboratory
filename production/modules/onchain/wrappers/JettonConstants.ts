export enum JettonOps {
    Transfer = 0xf8a7ea5, // 260734629
    TransferNotification = 0x7362d09c,
    InternalTransfer = 0x178d4519,
    Excesses = 0xd53276db, // 3576854235
    Burn = 0x595f07bc,
    BurnNotification = 0x7bdd97de,

    ProvideWalletAddress = 0x2c76b973,
    TakeWalletAddress = 0xd1735400,
    Mint = 0x642b7d07,
    ChangeAdmin = 0x6501f354,
    RevokeAdmin = 0x471ffff3,
    Upgrade = 0x2508d66a,
    CallTo = 0x235caf52,
    TopUp = 0xd372158c,
    ChangeMetadataUrl = 0xcb862902,
    SetStatus = 0xeed236d3,
}

export enum Errors {
    InvalidOp = 72,
    WrongOp = 0xffff,
    NotOwner = 73,
    NotValidWallet = 74,
    WrongWorkchain = 333,

    ContractLocked = 45,
    BalanceError = 47,
    NotEnoughGas = 48,
    InvalidMessage = 49,
    DiscoveryFeeNotMatched = 75,
}



