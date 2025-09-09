import pittmunlogo from '../../assets/pittmunlogo.png';
import '../../assets/css/aboutSubclass.css';

const SecretariateCard = ({ person, loading }) => {

  return (
    <div className='sec-card' key={person.id}>
        <img 
          src={person.pfp_url || pittmunlogo} 
          alt={`${person.name}`} 
          className={`pfp ${loading ? 'picture-load' : ''}`}
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
