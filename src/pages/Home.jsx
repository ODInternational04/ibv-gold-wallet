import React from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  ShieldCheck,
  Coins,
  Wallet,
  Fingerprint,
  PackageCheck,
  Scale,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/ibvgold/Navbar";
import Footer from "../components/ibvgold/Footer";
import "./homepage.css";

export default function Home() {
  return (
    <div className="home-landing min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <main>
          <section id="buy-gold" className="home-hero">
            <div className="home-container home-hero-grid">
              <div className="home-hero-copy">
                <p className="home-eyebrow">
                  Physical gold. A digital connection.
                </p>
                <h1 className="home-display">
                  Something real.
                  <br />
                  Something <em>golden.</em>
                </h1>
                <p>
                  Buy real gold and hold it digitally in your IBV Gold wallet.
                  Track your holdings, sell your digital gold when you choose,
                  or redeem it for physical gold at any time—all from one app.
                </p>
                <div className="home-cta-row">
                  <Link className="home-button" to="/signup">
                    Start your gold journey
                  </Link>
                  <a className="home-button secondary" href="#what-we-offer">
                    Explore the wallet
                  </a>
                </div>
                <div className="home-hero-details">
                  <span>
                    <ShieldCheck size={17} />
                    Physical gold
                  </span>
                  <span>
                    <Wallet size={17} />
                    Digital access
                  </span>
                  <span>
                    <Gem size={17} />
                    IBV Gold
                  </span>
                </div>
              </div>
              <div className="home-visual">
                <img
                  className="home-visual-image"
                  src="/background-graphic.jpeg"
                  alt="A collection of gold Krugerrands illuminated by warm gold light"
                  fetchPriority="high"
                />
                <div className="home-visual-label">
                  <Coins size={28} />
                  <div>
                    <strong>Real gold. In your pocket.</strong>
                    <span>A timeless asset, a modern wallet.</span>
                  </div>
                </div>
                <span className="home-visual-tag">THE IBV GOLD COLLECTION</span>
              </div>
            </div>
          </section>
          <div className="home-strip">
            <div className="home-container home-strip-grid">
              <div className="home-strip-item">
                <Scale size={23} />
                Explore physical Krugerrands
              </div>
              <div className="home-strip-item">
                <Fingerprint size={23} />
                Identity-verified accounts
              </div>
              <div className="home-strip-item">
                <Wallet size={23} />
                Your portfolio in one place
              </div>
            </div>
          </div>
          <section id="what-we-offer" className="home-section">
            <div className="home-container">
              <div className="home-section-heading">
                <div>
                  <p className="home-eyebrow">A wallet with substance</p>
                  <h2 className="home-display">Gold, on your terms.</h2>
                </div>
                <p>
                  From your first look at gold to managing what you own, keep
                  the experience clear and connected.
                </p>
              </div>
              <div className="home-offerings">
                <article className="home-offer">
                  <span className="home-offer-icon">
                    <Coins size={24} />
                  </span>
                  <h3>
                    Find your place
                    <br />
                    in gold.
                  </h3>
                  <p>
                    Explore full and fractional Krugerrands, with product
                    details and pricing in one clear catalog.
                  </p>
                  <Link to="/app/transact">Explore the gold catalog</Link>
                  <img
                    src="/kr-1oz.jpg"
                    alt="One-ounce gold Krugerrand"
                    loading="lazy"
                  />
                </article>
                <article className="home-offer sage">
                  <span className="home-offer-icon">
                    <Wallet size={24} />
                  </span>
                  <h3>
                    A clearer view
                    <br />
                    of what’s yours.
                  </h3>
                  <p>
                    See your gold holdings, account activity, and wallet
                    balances without losing sight of the details.
                  </p>
                  <Link to="/app/dashboard">Discover your dashboard</Link>
                </article>
                <article className="home-offer clay">
                  <span className="home-offer-icon">
                    <PackageCheck size={24} />
                  </span>
                  <h3>
                    Stay close to
                    <br />
                    the real thing.
                  </h3>
                  <p>
                    Explore physical redemption options and view the current
                    redemption values for available products.
                  </p>
                  <Link to="/app/vault">Explore redemption</Link>
                </article>
              </div>
            </div>
          </section>
          <section id="about" className="home-security">
            <div className="home-container home-security-grid">
              <div>
                <p className="home-eyebrow">The confidence behind the gold</p>
                <h2 className="home-display">
                  A physical foundation.
                  <br />A thoughtful experience.
                </h2>
                <p className="home-security-summary">
                  Gold is tangible. Your connection to it should feel just as
                  clear. IBV Gold brings physical ownership and digital
                  convenience together.
                </p>
              </div>
              <div className="home-security-items">
                <div className="home-security-item">
                  <ShieldCheck size={28} />
                  <div>
                    <h3>Gold with a physical home</h3>
                    <p>
                      Physical gold is held in IBV Vaults in Johannesburg,
                      connecting your digital portfolio to real bullion.
                    </p>
                  </div>
                </div>
                <div className="home-security-item">
                  <Fingerprint size={28} />
                  <div>
                    <h3>Verification comes first</h3>
                    <p>
                      Identity verification is part of your account journey,
                      with document review before transactions are unlocked.
                    </p>
                  </div>
                </div>
                <div className="home-security-item">
                  <LockKeyhole size={28} />
                  <div>
                    <h3>Your account. Your records.</h3>
                    <p>
                      Sign in to view your holdings, account details, and
                      transaction activity in your personal wallet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="getting-started" className="home-section">
            <div className="home-container">
              <div className="home-section-heading">
                <div>
                  <p className="home-eyebrow">Your next chapter</p>
                  <h2 className="home-display">Make room for gold.</h2>
                </div>
                <p>
                  A straightforward start, with the details where you need them.
                </p>
              </div>
              <div className="home-steps">
                {[
                  [
                    "01",
                    "Create your account",
                    "Start with your email and password to create your personal IBV Gold wallet.",
                  ],
                  [
                    "02",
                    "Verify your identity",
                    "Submit your identity and address documents for review in your account.",
                  ],
                  [
                    "03",
                    "Get to know your gold",
                    "Explore the catalog, your portfolio dashboard, and the available redemption options.",
                  ],
                ].map(([number, title, description]) => (
                  <article className="home-step" key={number}>
                    <div className="home-step-number" aria-hidden="true">
                      {number}
                    </div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <section className="home-final">
            <div className="home-container">
              <div className="home-final-panel">
                <div>
                  <p className="home-eyebrow">
                    <Sparkles size={17} />A little more golden
                  </p>
                  <h2 className="home-display">
                    Your gold journey
                    <br />
                    starts with a simple step.
                  </h2>
                  <p>
                    Create your account and explore a world of physical gold.
                  </p>
                </div>
                <Link className="home-button" to="/signup">
                  Create your wallet
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
