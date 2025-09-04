import { useAppContext } from "./appContext";
import { toast } from "react-toastify";

export const useQuotes = () => {
    const { setQuotes, sendHeaders } = useAppContext();

    const fetchQuotes = async () => {
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
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes`, {
                method: 'POST',
                headers: { ...sendHeaders, 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify(quoteData)
            });

            if (response.ok) {
                fetchQuotes();
                toast.success('Quote added successfully!');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to add quote');
            }
        } catch (error) {
            console.error('Error adding quote:', error);
            toast.error('Failed to add quote. Please try again.');
        }
    };

    const updateQuote = async (id, quoteData) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes/${id}`, {
                method: 'PUT',
                headers: { ...sendHeaders, 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify(quoteData)
            });

            if (response.ok) {
                fetchQuotes();
                toast.success('Quote updated successfully!');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to update quote');
            }
        } catch (error) {
            console.error('Error updating quote:', error);
            toast.error('Failed to update quote. Please try again.');
        }
    };

    const deleteQuote = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes/${id}`, {
                method: 'DELETE',
                headers: { ...sendHeaders, 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });

            if (response.ok) {
                fetchQuotes();
                toast.success('Quote deleted successfully!');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to delete quote');
            }
        } catch (error) {
            console.error('Error deleting quote:', error);
            toast.error('Failed to delete quote. Please try again.');
        }
    };

    return { fetchQuotes, addQuote, updateQuote, deleteQuote };
}