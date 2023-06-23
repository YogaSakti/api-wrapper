import express from 'express';
// import fetch from 'cross-fetch';
// import asyncHandler from 'express-async-handler'
// import { TransactionConfirmationStrategy,   } from '@solana/web3.js'

import { Connection, Keypair, SystemProgram, Transaction  } from '@solana/web3.js'
// @ts-ignore
import { Metaplex, PublicKey } from '@metaplex-foundation/js';
import * as base58 from "base-58";
import { createQROptions } from '@solana/pay';
import { QRCodeCanvas } from 'styled-qr-code-node-typescript';
// import QRCode from "qrcode"

const router = express.Router();


// Home page route.
router.get("/", function (req, res) {
    res.contentType('application/json');
    res.status(200).send({
        status: 'ok',
        label: 'Solana Pay',
        icon: 'https://svgtopng.com/download/b631qle1c5g1g72i/file_1meh6qc1r3f1ukoir0de9k85pf/solanapay-logo.png'
    });
});

router.post("/", async function (req, res) {
    const accountField = req.body?.account;
    if (!accountField) throw new Error('missing account');
    const bankSecretKey = process.env.BANK_SECRET_KEY
    if (!bankSecretKey) throw new Error('missing bank secret key');
    const bank = Keypair.fromSecretKey(new Uint8Array(JSON.parse(bankSecretKey)));

    const sender = new PublicKey(accountField);

    // Build Transaction
    const ix = SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: bank.publicKey,
        lamports: 133700000
    })

    let transaction = new Transaction();
    transaction.add(ix);

    const connection = new Connection('https://mainnet-beta.solflare.network')
    const bh = await connection.getLatestBlockhash();
    transaction.recentBlockhash = bh.blockhash;
    transaction.feePayer = bank.publicKey; 

    // for correct account ordering 
    transaction = Transaction.from(transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    }));

    transaction.sign(bank);
    console.log(base58.encode(transaction.signature));

    // airdrop 1 SOL just for fun
    // connection.requestAirdrop(sender, 1000000000);

    // Serialize and return the unsigned transaction.
    const serializedTransaction = transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    });

    const base64Transaction = serializedTransaction.toString('base64');
    const message = 'Thank you for Paying!';

    // const strategy : TransactionConfirmationStrategy =  {
    //   signature: transaction.
    // }
    // connection.confirmTransaction();

    res.status(200).send({ transaction: base64Transaction, message });

});

router.get("/qr/", async (req, res) => {
    console.log(`Creating QR Code`);

    const SOLANA_PAY_URL = "solana:dari.asia/api/solana";
    const qrOption = createQROptions(SOLANA_PAY_URL, 360, 'white', 'black');

    qrOption.image = require('path').join(__dirname, 'solana.png')
    const qr = new QRCodeCanvas(qrOption)
    const dataQR = await qr.toDataUrl()

    res.status(200).send(`<img src=${dataQR} >`);
});




export default router;