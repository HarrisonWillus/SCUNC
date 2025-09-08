import { useEffect } from 'react'
import AddSecretariat from '../../components/adminButtons/AddSecretariat';
import AddQuote from '../../components/adminButtons/AddQuote';
import SecretariateOrderManager from '../../components/adminButtons/SecretariateOrderManager';
import { SEOHelmet } from '../../components/SEOHelmet';

// context and hooks
import { usePeople } from '../../utils/usePeople';
import { useAppContext } from '../../utils/appContext';

// styles
import '../../assets/css/aboutSubclass.css';

import SecretariateCard from '../../components/cards/SecretariateCard';
import pittmunlogo from '../../assets/pittmunlogo.png';
import { UserPlus } from 'lucide-react';

const Secretariat = () => {
  const { secretariates, loading, isAdmin, setShowAnimation, showOrderManager, setShowOrderManager, showQuoteManager } = useAppContext();
  const { fetchSecretariates } = usePeople();

  useEffect(() => {
    fetchSecretariates();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <SEOHelmet 
        title="Meet the Secretariat - SCUNC 2026"
        description="Meet the dedicated student leaders organizing the Steel City United Nations Conference. Learn about our Secretariat team driving Pittsburgh's first collegiate Model UN conference."
        keywords="SCUNC Secretariat, Model UN leadership, Pittsburgh MUN team, University of Pittsburgh students, conference organizers, Steel City United Nations Conference team"
        canonical="https://scuncmun.org/about/secretariat"
      />
      <main>
        <header className='page-header'>
            <div className='header-container'>
                <h1 className='aboutsub-title'>Meet the Secretariat</h1>
            </div>
        </header>

        <section className='about-sub-container'>
            {loading ? (
              <SecretariateCard person={{ name: "No Name at this time", title: "No title at this time", description: "No description at this time", pfp_url: pittmunlogo }} loading={loading} />
            ) : (
              secretariates.map((person) =>
                <SecretariateCard person={person} loading={loading} />
              )
            )}
        </section>

        {isAdmin && (
          <div className="admin-floating-controls">
            <button 
              className='admin-fab' 
              onClick={() => {setShowAnimation(true)}}
            >
              <UserPlus size={20} />
            </button>
          </div>
        )}

        <AddSecretariat />

        {/* Quote Manager Modal */}
        {showQuoteManager && (
          <AddQuote />
        )}

        {/* Order Manager Modal */}
        {showOrderManager && (
          <SecretariateOrderManager
            secretariates={secretariates}
            onClose={() => {
              setShowOrderManager(false);
              fetchSecretariates(); // Refresh data after reordering
            }}
          />
        )}
    </main>
    </>
  )
}

export default Secretariat
