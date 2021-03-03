"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
class Transaction {
    constructor(amount, payer, // public key
    payee //private key 
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    constructor(prevHash, transaction, timestamp = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.timestamp = timestamp;
        this.nonce = Math.round(Math.random() * 999999999); // generate a one time use random number
    }
    get hash() {
        const str = JSON.stringify(this); // stringify the object
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
class Chain {
    constructor() {
        this.chain = [new Block("", new Transaction(100, 'genesis', 'satoshi'))]; //define the first block in the chain. GENESIS BLOCK. Previous hash is empty 
        //becuase theres nothing it link to. We then instatiate a new transaction
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(transaction, senderPublicKey, signature) {
        const verifier = crypto.createVerify('SHA256'); // use cypto to create a signature verification.
        verifier.update(transaction.toString()); // pass the transcation data to the verifier
        const isValid = verifier.verify(senderPublicKey, signature); // verify the transaction has not been tempered with
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
    mine(nonce) {
        let solution = 1;
        console.log('mining..............');
        while (true) {
            const hash = crypto.createHash('MD5'); // craete a hash with the md5 alg    
            hash.update((nonce + solution).toString()).end(); // keep creating our hash 
            const attempt = hash.digest('hex');
            if (attempt.substr(0, 1) === '0000') { // check to see if the first 4 numbers of our attempt starts with 4 zeros
                console.log('Solved: ${solution}');
                return solution;
            }
            solution += 1;
        }
    }
}
Chain.instance = new Chain(); //singleton instance so we only have one block chain
class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        }); // use rsa to generate a public and private key.
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey); // specify the amount and the public key of the user being paid.
        const sign = crypto.createSign('SHA256'); // create a signature
        sign.update(transaction.toString()).end(); // using the transcation data as the valid for our signature
        const signature = sign.sign(this.privateKey); // create a signature using the private key
        Chain.instance.addBlock(transaction, this.publicKey, signature); // add the tranction to the block chain by passing in the transaction,public key and signature
    }
}
const satoshi = new Wallet();
const payer2 = new Wallet();
const payer3 = new Wallet();
satoshi.sendMoney(100, payer2.publicKey); // satoshi sends money to payer2
payer2.sendMoney(67, payer3.publicKey); // payer2 sends money to payer3
payer3.sendMoney(150, payer2.publicKey); // payer3 sends money to payer2
console.log(Chain.instance);
