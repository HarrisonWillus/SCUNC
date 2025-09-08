import { useState } from 'react';
import AddCommittee from '../components/adminButtons/AddCommittee';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link } from 'react-router-dom';
import { useAppContext } from '../utils/appContext';
import { ExternalLink, Download, Users, Settings } from 'lucide-react';
import '../assets/css/committees.css';
import { useCommittees } from '../utils/useCommittees';

const Committees = () => {
  const { committees, isAdmin, setShowAnimation, showAnimation } = useAppContext();
  // eslint-disable-next-line
  const { fetchCommittees } = useCommittees();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Ensure committees is an array before processing
  const safeCommittees = committees || [];

  // Group committees by category
  const groupedCommittees = safeCommittees.reduce((acc, committee) => {
    const categoryName = committee.category_title || committee.category || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(committee);
    return acc;
  }, {});

  // Get all unique categories from committees
  const availableCategories = ['All', ...Object.keys(groupedCommittees)];

  // Filter committees based on selected category
  const filteredCommittees = selectedCategory === 'All' 
    ? safeCommittees 
    : groupedCommittees[selectedCategory] || [];

  return (
    <>
      <SEOHelmet 
        title="Committees - SCUNC 2026"
        description="Explore diverse Model UN committees at SCUNC including Crisis Committees, General Assembly, and ECOSOC. Find background guides and committee details."
        keywords="Model UN committees, SCUNC committees, Crisis Committee, General Assembly, ECOSOC, background guides, Model UN topics"
        canonical="https://scuncmun.org/committees"
      />
      <main>
      <header className='page-header-img committees'>
        <div className='header-container-img'>
          <h1 className='title' style={{fontSize: '56px'}}>Committees</h1>
          <p className='subtitle'>Explore our diverse range of Model UN committees</p>
        </div>
      </header>
      
      {/* Category Filter */}
      <section className='category-filter-section'>
        <div className='filter-container'>
          <h2>Browse by Category</h2>
          <div className='category-tabs'>
            {availableCategories.map(category => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
                {category !== 'All' && (
                  <span className='committee-count'>
                    {groupedCommittees[category]?.length || 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Committees Grid */}
      <section className='committees-grid-container'>
        {filteredCommittees.length > 0 ? (
          <div className='committees-grid'>
            {filteredCommittees.map((committee) => (
              <div key={committee.id} className='committee-card'>
                <div className='committee-image-container'>
                  {committee.image_url ? (
                    <img 
                      src={committee.image_url} 
                      alt={committee.title} 
                      className='committee-image'
                    />
                  ) : (
                    <div className='committee-placeholder'>
                      <Users size={48} />
                    </div>
                  )}
                  <div className='committee-overlay'>
                    <span className='committee-category'>
                      {committee.category_title || committee.category}
                    </span>
                  </div>
                </div>
                
                <div className='committee-content'>
                  <h3 className='committee-title'>{committee.title}</h3>
                  
                  <p className='committee-description'>
                    {committee.description && committee.description.length > 150 
                      ? `${committee.description.substring(0, 150)}...` 
                      : committee.description || 'No description available'
                    }
                  </p>
                  
                  {committee.topics && committee.topics.length > 0 && (
                    <div className='committee-topics'>
                      <h4>Topics:</h4>
                      <ul>
                        {committee.topics.map((topic, index) => (
                          <li key={index}>{topic.topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className='committee-actions'>
                    {committee.background_guide_url && (
                      <a 
                        href={committee.background_guide_url} 
                        target='_blank' 
                        rel='noopener noreferrer'
                        className='action-button guide-button'
                      >
                        <Download size={16} />
                        Background Guide
                      </a>
                    )}
                    
                    <Link 
                      to={`/committees/${committee.id}`} 
                      className='action-button details-button'
                    >
                      <ExternalLink size={16} />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='no-committees'>
            <Users size={64} />
            <h3>No Committees Found</h3>
            <p>
              {selectedCategory === 'All' 
                ? 'No committees have been added yet.' 
                : `No committees found in the "${selectedCategory}" category.`
              }
            </p>
            {selectedCategory !== 'All' && (
              <button 
                className='btn btn-secondary'
                onClick={() => setSelectedCategory('All')}
              >
                View All Committees
              </button>
            )}
          </div>
        )}
      </section>
      
      {/* Feedback Section */}
      <section className='feedback-section'>
        <div className='feedback-card'>
          <h2>Report a Concern</h2>
          <p>Have feedback or concerns about our committees? We'd love to hear from you.</p>
          <Link 
            to='https://docs.google.com/forms/d/e/1FAIpQLSepK26qT7oz93AgU9Nof-kg8VMBoyQZxbW-ixss8Ghen8YqhA/viewform' 
            target='_blank' 
            className='feedback-button form-button page-button'
          >
            <ExternalLink size={16} />
            Visit Form
          </Link>
        </div>
      </section>

      {isAdmin && (
        <div className='admin-floating-controls'>
          <button
            className='admin-fab'
            onClick={() => {
              setShowAnimation(!showAnimation);
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      <AddCommittee />
    </main>
    </>
  )
}

export default Committees
