import fetch from 'cross-fetch'
import { load } from 'cheerio'

/**
 * Event interface for Artatix events
 */
export interface Event {
    name: string
    date: string
    location: string
    price: string
    image: string
    slug: string
    status: string
}

/**
 * Fetch list of available events from Artatix
 */
export const eventList = async (): Promise<Event[]> => {
    const url = 'https://artatix.co.id/explore'
    const response = await fetch(url)
    const body = await response.text()
    const $ = load(body)

    const events: Event[] = []

    // Select the relevant elements and extract the data
    $('div#frame-card-event').each((i, element) => {
        const eventElement = $(element)

        const isSoldOut = eventElement.hasClass('overlay-grey')
        const event: Event = {
            name: eventElement.find('.event-name h5').text().trim(),
            date: eventElement.find('.event-calendar label').text().trim(),
            location: eventElement.find('.event-location label').text().trim(),
            price: eventElement.find('.event-price span').text().trim() || 'SOLD OUT',
            image: `https://artatix.co.id/${eventElement.find('.banner-event img').attr('src') || ''}`,
            slug: (eventElement.find('a').attr('href') || '').replace('event/', ''),
            status: isSoldOut ? 'Sold Out' : 'Available',
        }

        // Skip if the event is sold out
        if (!isSoldOut) {
            events.push(event)
        }
    })

    return events
}

/**
 * Extract ticket information for a specific event
 */
export const extractTicket = async (slug: string) => {
    const response = await fetch(`https://artatix.co.id/event/${slug}`)
    const body = await response.text()
    const $ = load(body)

    const eventInfo = {
        creatorName: $('.creator_name span').text().trim(),
        time: $('.time-text span').text().trim(),
    }

    const ticketInfo: { name: string; status: string; price: string }[] = []
    $('.card-tiket').each((index, element) => {
        const name = $(element).find('.ticket-name span').text().trim()
        const status = $(element).find('.ticket-status span').text().trim()
        const price = $(element).find('.ticket-price span').text().trim()
        ticketInfo.push({ name, status, price })
    })

    return { ticketInfo, eventInfo }
}

/**
 * Check if Artatix service is healthy
 */
export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch('https://artatix.co.id')
        return response.status === 200
    } catch (error) {
        console.error('Artatix healthcheck error:', error)
        return false
    }
}