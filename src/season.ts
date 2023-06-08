import express from 'express';
import fetch from 'cross-fetch';
import asyncHandler from 'express-async-handler'

const router = express.Router();

// Home page route.
router.get("/", function (req, res) {
    res.status(200).send({ status: 'ok' });
});

const seasonOneWL = [
    'TELEPORT2',
    'Ascension of Toonies',
    'iSolmetric',
    'Non-fungible Portrait',
    'The Nova',
    'The Solana Sorcerer',
    'The Nova - Special Edition',
    'The Tarsier Viking',
    'O',
    'Corrupted Mask',
    'Chimera'
]

router.get("/one", asyncHandler(async (req, res, next) => {
    const one = await fetch("https://drip-value.herokuapp.com/season1_all", {
        headers: {
            "accept": "application/json"
        },
        method: "GET"
    }).then(res => res.json());

    let data = one.data;

    data = data.filter((item: { name: string; }) => seasonOneWL.includes(item.name));

    res.status(200).send(data);
}));


const seasonTwoWL = []

router.get("/two", asyncHandler(async (req, res, next) => {
    const two = await fetch("https://drip-value.herokuapp.com/season2_all", {
        headers: {
            "accept": "application/json"
        },
        method: "GET"
    }).then(res => res.json());

    let data = two.data;

    data = data.filter((item: { name: string; }) => seasonTwoWL.includes(item.name));

    res.status(200).send(data);
}));


export default router;