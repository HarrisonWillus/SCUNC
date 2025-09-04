import pittmunlogo from '../../assets/pittmunlogo.png';
import '../../assets/css/aboutSubclass.css';

const SecretariateCard = ({ person, loading }) => {
  // Debug logging for image URL
  console.log('🖼️ SecretariateCard Debug:', {
    name: person.name,
    pfp_url: person.pfp_url,
    hasUrl: !!person.pfp_url,
    urlLength: person.pfp_url ? person.pfp_url.length : 0,
    fallbackUsed: !person.pfp_url
  });

  const handleImageError = (e) => {
    console.log('❌ Image failed to load:', person.pfp_url);
    console.log('🔄 Falling back to default logo');
    e.target.src = pittmunlogo;
  };

  const handleImageLoad = (e) => {
    console.log('✅ Image loaded successfully:', person.pfp_url);
  };

  return (
    <div className='sec-card' key={person.id}>
        <img 
          src={person.pfp_url || pittmunlogo} 
          alt={`${person.name}`} 
          className={`pfp ${loading ? 'picture-load' : ''}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        <div className='profile'>
            <div className='person'>
                <h3>{person.name}</h3>
                <h4 className='position'>{person.title}</h4>
            </div>
            <p className='Person-description'>{person.description}</p>
        </div>
    </div>
  )
}

export default SecretariateCard
