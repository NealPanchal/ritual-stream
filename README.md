# RitualStream

RitualStream is a decentralized, Web3-native streaming platform. It integrates seamless video streaming with on-chain access control, allowing users to unlock unlimited streaming by interacting with smart contracts on the Base network.

## 🚀 Features

- **Decentralized Access Control:** Access to streaming content is managed via smart contracts. Users pay a small fee (0.05 ETH/RIT) on the Base chain for unlimited 24-hour access.
- **Adaptive Provider Ranking Engine:** Automatically fetches and ranks video streams based on health, latency, and success rates. Custom fallback mechanisms ensure the highest reliability (e.g., StreamIMDb prioritisation).
- **Beautiful UI/UX:** Built with Next.js, Tailwind CSS, and Framer Motion for a fluid, glassmorphic, and highly responsive user experience.
- **Web3 Integration:** Powered by Wagmi, Viem, and Coinbase OnchainKit for robust wallet connections and transaction handling.
- **Authentication & Database:** Integrates Clerk for authentication and Supabase for backend data storage.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Web3:** [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/), [Coinbase OnchainKit](https://onchainkit.xyz/)
- **Auth & DB:** [Clerk](https://clerk.dev/), [Supabase](https://supabase.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/NealPanchal/ritual-stream.git
   cd ritual-stream
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   # Add your specific Clerk, Supabase, TMDB, and Web3 RPC keys here
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   TMDB_API_KEY=...
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=...
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Smart Contract (Access Gate)

The platform relies on the `RitualStreamAccess.sol` and `BaseStreamAccess.sol` contracts for managing the 24-hour unlocking logic. Ensure your wallet is connected to the Base network when testing on-chain transactions.

## 🎥 Providers

RitualStream utilizes multiple backup streaming providers to ensure maximum uptime. StreamIMDb is hard-pinned as the primary provider. If the primary provider fails, the adaptive ranking system instantly switches to the next healthiest provider without interrupting the user experience.

## 📄 License

This project is licensed under the MIT License.
