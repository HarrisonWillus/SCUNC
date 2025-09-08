import { useAppContext } from "./appContext";
import { toast } from "react-toastify";

export const useQuotes = () => {
    const { setQuotes, sendHeaders, setLoading } = useAppContext();

    const fetchQuotes = async () => {
        setLoading(true);
        console.log('Fetching quotes...');

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes`, {
                method: 'GET',
                headers: sendHeaders,
            });

            if (response.ok) {
                console.log('Fetched quotes successfully');
                const data = await response.json();
                console.log('Quotes data:', data);
                setQuotes(data);
            } else {
                console.error('Failed to fetch quotes');
            }
        } catch (error) {
            console.error('Error fetching quotes:', error);
        }
    };

    const addQuote = async (quoteData) => {
        setLoading(true);
        console.log('Starting addQuote...');
        console.log('Quote data:', quoteData);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes`, {
                method: 'POST',
                headers: { ...sendHeaders, 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify(quoteData)
            });
            setLoading(false);

            if (response.ok) {
                fetchQuotes();
                console.log('Quote added successfully');
                toast.success('Quote added successfully!');
            } else {
                const errorData = await response.json();
                console.error('Failed to add quote:', errorData);
                toast.error(errorData.error || 'Failed to add quote');
            }
        } catch (error) {
            console.error('Error adding quote:', error);
            toast.error('Failed to add quote. Please try again.');
        } finally {
            console.log('Finished addQuote');
            setLoading(false);
        }
    };

    const updateQuote = async (id, quoteData) => {
        setLoading(true);
        console.log('Starting updateQuote...');
        console.log('Updating quote ID:', id, 'with data:', quoteData);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes/${id}`, {
                method: 'PUT',
                headers: { ...sendHeaders, 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify(quoteData)
            });

            if (response.ok) {
                fetchQuotes();
                console.log('Quote updated successfully');
                toast.success('Quote updated successfully!');
            } else {
                const errorData = await response.json();
                console.error('Failed to update quote:', errorData);
                toast.error(errorData.error || 'Failed to update quote');
            }
        } catch (error) {
            console.error('Error updating quote:', error);
            toast.error('Failed to update quote. Please try again.');
        } finally {
            console.log('Finished updateQuote');
            setLoading(false);
        }
    };

    const deleteQuote = async (id) => {
        setLoading(true);
        console.log('Starting deleteQuote...');
        console.log('Deleting quote with ID:', id);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes/${id}`, {
                method: 'DELETE',
                headers: { ...sendHeaders, 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });

            if (response.ok) {
                fetchQuotes();
                console.log('Quote deleted successfully');
                toast.success('Quote deleted successfully!');
            } else {
                const errorData = await response.json();
                console.error('Failed to delete quote:', errorData);
                toast.error(errorData.error || 'Failed to delete quote');
            }
        } catch (error) {
            console.error('Error deleting quote:', error);
            toast.error('Failed to delete quote. Please try again.');
        } finally {
            console.log('Finished deleteQuote');
            setLoading(false);
        }
    };

    return { fetchQuotes, addQuote, updateQuote, deleteQuote };
}