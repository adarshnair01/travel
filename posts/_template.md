---
# Copy this file to posts/YYYY-MM-DD-your-slug.md (the date prefix is what publishes it),
# or generate one with the Story Desk: `cd generator && npm start`.
# The URL becomes /travel/stories/<year>/<your-slug>/.
# Every story uses the same fixed layout (generator/layout.mjs). Keep the ## headings below.
title: "Three slow days in Hampi"
date: 2026-12-01
description: "One or two sentences for the card, search results and social previews."
place: "Hampi"
country: "India"
tripDates: "December 2026"
# Put photos in posts/images/<your-slug>/ and point at them relative to this file.
cover: ./images/hampi/cover.jpg
coverAlt: "Boulders and temple towers at sunrise"
tags: [karnataka, history, itinerary]
draft: true # remove this line (or set false) to publish
# Booking boxes: the site closes "Getting there", "Where to stay", "Top things to do" and
# "Good to know" with a small box of partner links built from this block (site/src/affiliates.mjs
# holds the affiliate IDs). Every field is optional; leave out `book:` entirely for no boxes.
book:
  bus: { from: "Bengaluru", to: "Hosapete", fromSlug: "bangalore", toSlug: "hospet" } # redbus.in/bus-tickets/<from>-to-<to>
  flight: { from: "Bengaluru", to: "Mangaluru", fromSlug: "bangalore", toSlug: "mangalore" } # MakeMyTrip route page
  train: "Trains to Hosapete Junction" # or true; links to IRCTC (no commission)
  stays:
    # agoda: the slug in agoda.com/city/<slug>.html; hostelworld: the path in hostelworld.com/st/hostels/<path>/
    - { area: "Hampi", note: "Optional one-liner", search: "Hampi", agoda: "hampi-in", hostelworld: "asia/india/hampi" }
  activities:
    - { label: "Guided heritage tours", query: "Hampi" } # searched on GetYourGuide, Klook and Viator
  gear:
    - { label: "Wide-brim sun hat", query: "wide brim sun hat" } # Amazon.in search
  abroad: true # adds Airalo eSIM and SafetyWing insurance for visitors from abroad
---

Open with a vivid moment from the trip. Then say who this place is for.

## At a glance

| | |
| --- | --- |
| Best time to go | |
| Days you need | |
| Getting there | |
| Daily budget | |
| Language | |
| Currency | |
| Good for | |

## Why go

![Photo alt text](./images/hampi/photo.jpg)
*Caption on the line right after the photo.*

## Getting there

## Getting around

## Where to stay

## Top things to do

### First experience

## Off the beaten path

### A lesser-known spot

## Things you probably didn't know

- **Short hook.** The surprising fact.

## What to eat

## A suggested itinerary

### Day 1: Theme

- Morning:
- Afternoon:
- Evening:

## What it costs

| Item | Budget | Mid-range |
| --- | --- | --- |
| Stay (per night) | | |
| Food (per day) | | |
| Local transport (per day) | | |
| Entry fees | | |
| **Total per day** | | |

## Good to know

## Final word

