import express from 'express';
import fetch from 'cross-fetch';
import { load } from 'cheerio';
import asyncHandler from 'express-async-handler';

import CacheService from './utils/cache.service'

// cache for 5 minutes
const ttl = 60 * 5
const cache = new CacheService(ttl) // Create a new cache service instance

// Define types for events
interface Event {
    name: string;
    date: string;
    location: string;
    price: string;
    image: string;
    slug: string;
    status: string;
}

const eventList = async (): Promise<Event[]> => {
    const url = 'https://artatix.co.id/explore';
    const response = await fetch(url);
    const body = await response.text();
    const $ = load(body);

    let events: Event[] = [];

    // Select the relevant elements and extract the data
    $('div#frame-card-event').each((i, element) => {
        const eventElement = $(element);
        const isSoldOut = eventElement.hasClass('overlay-grey');
        const event: Event = {
            name: eventElement.find('.event-name h5').text().trim(),
            date: eventElement.find('.event-calendar label').text().trim(),
            location: eventElement.find('.event-location label').text().trim(),
            price: eventElement.find('.event-price span').text().trim() || 'SOLD OUT',
            image: `https://artatix.co.id/${eventElement.find('.banner-event img').attr('src') || ''}`,
            slug: (eventElement.find('a').attr('href') || '').replace('event/', ''),
            status: isSoldOut ? 'Sold Out' : 'Available',
        };

        // Skip if the event is sold out
        if (!isSoldOut) {
            events.push(event);
        }
    });

    return events;
};

const extractTicket = async (slug: string) => {
    const response = await fetch(`https://artatix.co.id/event/${slug}`);
    const body = await response.text();
    const $ = load(body);

    const eventInfo = {
        creatorName: $('.creator_name span').text().trim(),
        time: $('.time-text span').text().trim(),
    };

    const ticketInfo: { name: string; status: string; price: string }[] = [];
    $('.card-tiket').each((index, element) => {
        const name = $(element).find('.ticket-name span').text().trim();
        const status = $(element).find('.ticket-status span').text().trim();
        const price = $(element).find('.ticket-price span').text().trim();
        ticketInfo.push({ name, status, price });
    });

    return { ticketInfo, eventInfo };
};

const router = express.Router();

router.get('/', (req, res) => {
    // Healthcheck artatix endpoint
    fetch('https://artatix.co.id').then((response) => {
        if (response.status === 200) {
            res.status(200).json({ status: 'ok' });
        } else {
            res.status(500).json({ status: 'error' });
        }
    });
});

router.get(
    '/tickets/:slug',
    asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const data = await extractTicket(slug);
        res.status(200).send(data);
    })
);

router.get(
    '/events',
    asyncHandler(async (req, res) => {
        // Only use cache, if not cached, fetch from eventList() and store in cache
        const data = await cache.get('artatix-events', async () => await eventList());
        res.status(200).send(data);
    })
);


export default router;
