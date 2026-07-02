import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div style={{
      backgroundColor: 'var(--background)',
      color: 'var(--on-background)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      {/* Top Header Navbar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: 'rgba(247, 249, 251, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--surface-variant)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '800',
            fontFamily: 'var(--font-heading)'
          }}>A</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
              Aeloria Ledger
            </h1>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="landing-nav">
          <a href="#features" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: '500' }}>Features</a>
          <a href="#pricing" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: '500' }}>Pricing</a>
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>Sign In</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)' }}>Get Started</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '160px 40px 100px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Mesh */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
          <motion.div
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -50, 100, 0],
              scale: [1, 1.2, 0.8, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '-10%',
              right: '-5%',
              width: '50vw',
              height: '50vw',
              background: 'radial-gradient(circle, rgba(0, 242, 255, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(80px)'
            }}
          />
          <motion.div
            animate={{
              x: [0, -120, 80, 0],
              y: [0, 100, -80, 0],
              scale: [1, 0.9, 1.3, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '60vw',
              height: '60vw',
              background: 'radial-gradient(circle, rgba(0, 105, 111, 0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(100px)'
            }}
          />
          <motion.div
            animate={{
              x: [0, 80, -100, 0],
              y: [0, 120, -50, 0],
              scale: [1, 1.4, 0.9, 1],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '20%',
              left: '30%',
              width: '40vw',
              height: '40vw',
              background: 'radial-gradient(circle, rgba(0, 242, 255, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(90px)'
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: '850px', position: 'relative', zIndex: 1 }}
        >
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: 'var(--primary-container)',
            color: 'var(--on-primary-container)',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '24px',
            fontFamily: 'var(--font-heading)'
          }}>
            Now in Active Beta
          </span>
          <h2 style={{
            fontSize: '56px',
            lineHeight: '64px',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-heading)',
            color: 'var(--inverse-surface)',
            marginBottom: '24px'
          }}>
            The Enterprise Finance OS for Modern Operations
          </h2>
          <p style={{
            fontSize: '18px',
            lineHeight: '28px',
            color: 'var(--on-surface-variant)',
            maxWidth: '650px',
            margin: '0 auto 40px auto'
          }}>
            Aeloria Ledger brings absolute billing control, dynamic multi-tier invoicing, automatic payment log integrations, and customized financial PDF generation to your business.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
              Create Free Workspace
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '15px' }}>
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Dashboard Mockup Grid Screen Card */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
          style={{
            marginTop: '80px',
            maxWidth: '1000px',
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: 'var(--glass-border)',
            boxShadow: 'var(--shadow-premium)',
            background: 'var(--glass-bg)',
            padding: '8px',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{
            backgroundColor: '#0a192f',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            color: '#ffffff',
            textAlign: 'left'
          }}>
            {/* Mock Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
                <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--outline-variant)', fontWeight: '500' }}>ledger.aeloria.com/dashboard</span>
              </div>
              <span className="badge" style={{ backgroundColor: 'rgba(0, 242, 255, 0.1)', color: 'var(--primary-container)' }}>ACTIVE SESSION</span>
            </div>

            {/* Mock Dashboard Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '11px', color: 'var(--outline-variant)', textTransform: 'uppercase', fontWeight: '600' }}>Total Revenue</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: 'var(--primary-container)' }}>$248,500.00</h3>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '11px', color: 'var(--outline-variant)', textTransform: 'uppercase', fontWeight: '600' }}>Pending Invoices</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#ffbd2e' }}>$18,450.00</h3>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '11px', color: 'var(--outline-variant)', textTransform: 'uppercase', fontWeight: '600' }}>Active Clients</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: '#27c93f' }}>42 Users</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--outline-variant)', textTransform: 'uppercase' }}>Recent Invoices</span>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>INV-2026-1002</span>
                <span style={{ color: 'var(--outline-variant)', fontSize: '13px' }}>Aeloria Cloud Systems</span>
                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary-container)' }}>$12,500.00</span>
                <span className="badge" style={{ backgroundColor: 'rgba(39, 201, 63, 0.1)', color: '#27c93f', fontSize: '10px' }}>Paid</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>INV-2026-1003</span>
                <span style={{ color: 'var(--outline-variant)', fontSize: '13px' }}>Stellar Digital Hub</span>
                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary-container)' }}>$5,950.00</span>
                <span className="badge" style={{ backgroundColor: 'rgba(255, 189, 46, 0.1)', color: '#ffbd2e', fontSize: '10px' }}>Pending</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
            Complete Financial Control. Zero Complexity.
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: '12px', fontSize: '16px' }}>
            Built specifically to help growing teams consolidate operational statistics and client billings.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }} className="features-grid">
          <div className="glass-panel" style={{ padding: '32px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--primary)', marginBottom: '16px' }}>
              receipt_long
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Pixel-Perfect Billing</h3>
            <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: '22px' }}>
              Generate structured, professional business invoices. Track collection stages in real-time and settle balances with client ledger hooks.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--primary)', marginBottom: '16px' }}>
              description
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Dynamic Quotes Creator</h3>
            <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: '22px' }}>
              Draft detailed quotes with custom item matrices. Dynamically incorporate localized GST levels or discount rates with instant totals calculating.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--primary)', marginBottom: '16px' }}>
              picture_as_pdf
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Real-time PDF Streaming</h3>
            <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: '22px' }}>
              Stream or download beautifully formatted corporate PDFs for quotes and invoices directly from the database server in a single click.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '100px 40px', backgroundColor: 'var(--surface-container-low)', width: '100%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
              Transparent, Value-Focused Pricing
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', marginTop: '12px', fontSize: '16px' }}>
              Scale your workspace as your finance operations expand. Start today for free.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }} className="pricing-grid">
            {/* Starter Plan */}
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starter</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '20px 0' }}>
                <span style={{ fontSize: '40px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>$0</span>
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>/ month</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '32px' }}>Ideal for solo operators and bootstrapped startups starting out.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Up to 5 Active Clients</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Basic Invoices & Expense Log</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Manual PDF Prints</li>
              </ul>
              <Link to="/register" className="btn btn-secondary" style={{ width: '100%' }}>Create Free Account</Link>
            </div>

            {/* Pro Plan */}
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', border: '2px solid var(--primary)', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 16px',
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                MOST POPULAR
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro Ops</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '20px 0' }}>
                <span style={{ fontSize: '40px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}>$49</span>
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>/ month</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '32px' }}>Perfect for growing organizations requiring full operations automation.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Unlimited Active Clients</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Automated Invoice & Quote PDFs</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Ledger Stats & Multi-role Team</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Dynamic GST & Discount Computations</li>
              </ul>
              <Link to="/register" className="btn btn-primary" style={{ width: '100%' }}>Launch Pro Workspace</Link>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '20px 0' }}>
                <span style={{ fontSize: '40px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>$199</span>
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>/ month</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '32px' }}>Custom architectures, priority generation capabilities, and support.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Infinite Active Workspaces</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Priority Dedicated PDF Servers</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> Custom Database Integration Hubs</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>check</span> 24/7 SLA Engineering Support</li>
              </ul>
              <a href="mailto:support@aeloria.com" className="btn btn-secondary" style={{ width: '100%' }}>Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: 'var(--inverse-surface)',
        color: 'var(--inverse-on-surface)',
        padding: '60px 40px 30px 40px',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          maxW: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '40px',
          marginBottom: '50px'
        }} className="footer-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                backgroundColor: 'var(--primary)', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--on-primary)', 
                fontWeight: '800', 
                fontSize: '16px',
                fontFamily: 'var(--font-heading)'
              }}>A</div>
              <div style={{ whiteSpace: 'nowrap' }}>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
                  Aeloria
                </h1>
                <p style={{ fontSize: '11px', color: 'var(--outline-variant)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ledger Workspace
                </p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--outline-variant)', lineHeight: '20px' }}>
              Enterprise finance operations and collection frameworks for progressive startups.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <li><a href="#features" style={{ color: 'var(--outline-variant)', textDecoration: 'none' }}>Features</a></li>
              <li><a href="#pricing" style={{ color: 'var(--outline-variant)', textDecoration: 'none' }}>Pricing Models</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <li><Link to="/login" style={{ color: 'var(--outline-variant)', textDecoration: 'none' }}>Corporate Login</Link></li>
              <li><Link to="/register" style={{ color: 'var(--outline-variant)', textDecoration: 'none' }}>Self Register</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '14px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security</h4>
            <p style={{ fontSize: '13px', color: 'var(--outline-variant)', lineHeight: '20px' }}>
              256-bit credentials encryption, secure role segregation keys, and database ledger structures.
            </p>
          </div>
        </div>

      </footer>

      {/* Media query styling injection */}
      <style>{`
        @media (max-width: 768px) {
          .landing-nav {
            display: none !important;
          }
          .features-grid, .pricing-grid, .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          h2 {
            fontSize: 36px !important;
            lineHeight: 44px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
