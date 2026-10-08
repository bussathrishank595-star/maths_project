# Network Packet Transmission Simulator

## Problem Statement

Data transmission over computer networks is not always perfectly reliable. Packets can be successfully delivered or lost. This project simulates packet transmission and uses probability theory to analyze the expected and observed number of successful transmissions.

## Objective

Demonstrate how Bernoulli Trials and the Binomial Distribution model packet-transmission reliability in an interactive, browser-only dashboard.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript

No backend, authentication, browser storage, or third-party chart library is used.

## Running the Project

Open `index.html` in any modern web browser. The project is fully static.

## Features

- Random packet transmission outcomes and live status updates
- Animated sender-to-receiver network view
- Binomial PMF chart generated with the Canvas API
- Exact, at-least, and at-most Binomial probabilities
- Mean, variance, and standard deviation
- Single and repeated simulations (1, 10, 100, or 1,000 runs)
- Law of Large Numbers convergence samples
- Responsive network-analysis dashboard

## Mathematical Concepts

Enter a data size, packet size, and network condition. The simulator calculates `n = ceil(data size / packet size)`, then assigns the simplified educational success probability from the chosen condition: Reliable (95%), Normal (80%), or Unstable (60%). It generates every delivered/lost packet outcome independently.

Each packet is a Bernoulli Trial with success probability `p`. For `n` independent packets, the number of successful packets `X` follows:

`X ~ Binomial(n, p)`

The probability mass function is:

`P(X = k) = C(n, k) p^k (1 - p)^(n-k)`

The dashboard also calculates:

- Mean: `μ = np`
- Variance: `σ² = np(1-p)`
- Standard deviation: `σ = √np(1-p)`

The JavaScript implementation evaluates probabilities in log space, avoiding factorial overflow for the supported range up to 1,000 packets.

## Real-world Applications

- Internet communication and TCP reliability studies
- Wi-Fi packet delivery analysis
- IoT device communications
- Video streaming quality monitoring
- Online gaming latency/loss demonstrations
- Cloud-service network reliability education

## Limitations

The model assumes a fixed packet count, two outcomes per packet, constant success probability, and independent outcomes. Real networks can have correlated losses caused by congestion, interference, routing problems, and changing network conditions. This simulator is an idealized educational model.
# maths_project
