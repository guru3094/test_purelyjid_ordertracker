# PurelyJid Order Management & Tracking System

## Objective

Provide customers with a real-time order tracking portal while allowing store staff to manage orders through Google Sheets.

## Source of Truth

Google Sheets

## Read Database

Supabase

## Hosting

Vercel

## Synchronization

Vercel Cron Job

## Architecture

Google Sheets
      ↓
Sync API
      ↓
Supabase
      ↓
Tracking API
      ↓
Customer UI
