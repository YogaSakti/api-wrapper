import express from 'express';
import fetch from 'cross-fetch';
import asyncHandler from 'express-async-handler'

const router = express.Router();

// Home page route.
router.get("/", function (req, res) {
    res.status(200).send({ status: 'ok' });
});

router.get("/winner/:id", asyncHandler(async (req, res, next) => {
    console.log(`Fetching winner for ${req.params.id}`);
    const id = req.params.id
    let string = [ 'YmFjaw==', 'b2ZmaWNl', 'bmV3', 'ZGFwcA==', 'cmFkYXI=', 'YWlyZHJvcHM=' ]
    string = string.map((str) => Buffer.from(str, 'base64').toString('ascii'))

    const request = await fetch(`https://${string[0]}${string[1]}-${string[2]}.${string[3]}${string[4]}.com/${string[5]}/${id}/winners?fiat=USD`, {
        headers: {
            "accept": "application/json",
            "Referer": `https://${string[3]}${string[4]}.com/hub/${string[5]}/`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        method: "GET"
    });

    let json = await request.json();

    // convert from array ['',''] to array of objects [{address},{address},{address}]
    json = json.map((address: String) => ({ address }))

    res.status(200).send(json);
}));





export default router;