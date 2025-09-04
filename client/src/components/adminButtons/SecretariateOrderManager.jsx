import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X,
  Check
} from 'lucide-react';
import pittmunlogo from '../../assets/pittmunlogo.png';
import { usePeople } from '../../utils/usePeople';
import { toast } from 'react-toastify';
import '../../assets/css/secretariateOrderManager.css';

// Sortable Item Component
const SortableSecretariateItem = ({ person, index, totalCount, onMoveUp, onMoveDown }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: person.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleImageError = (e) => {
    e.target.src = pittmunlogo;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-secretariate-card ${isDragging ? 'dragging' : ''}`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="drag-handle"
        title="Drag to reorder"
      >
        <GripVertical size={20} />
      </div>

      {/* Card Content */}
      <div className="card-content">
        <img 
          src={person.pfp_url || pittmunlogo} 
          alt={person.name}
          onError={handleImageError}
          className="person-image"
        />
        <div className="person-info">
          <h3>{person.name}</h3>
          <p>{person.title}</p>
        </div>
      </div>

      {/* Arrow Controls */}
      <div className="order-controls">
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="order-btn up"
          title="Move up"
          type="button"
        >
          <ChevronUp size={16} />
        </button>
        <span className="position-indicator">{index + 1}</span>
        <button
          onClick={() => onMoveDown(index)}
          disabled={index === totalCount - 1}
          className="order-btn down"
          title="Move down"
          type="button"
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
};

// Main Order Manager Component
const SecretariateOrderManager = ({ secretariates, onClose }) => {
  const [orderedSecretariates, setOrderedSecretariates] = useState([...secretariates]);
  const [isSaving, setIsSaving] = useState(false);
  const { updateSecretariate } = usePeople();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setOrderedSecretariates((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order numbers based on new positions
        return newItems.map((item, index) => ({
          ...item,
          order_num: index + 1
        }));
      });
    }
  };

  const handleMoveUp = (currentIndex) => {
    if (currentIndex === 0) return;
    
    const newItems = [...orderedSecretariates];
    [newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]];
    
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order_num: index + 1
    }));
    
    setOrderedSecretariates(updatedItems);
  };

  const handleMoveDown = (currentIndex) => {
    if (currentIndex === orderedSecretariates.length - 1) return;
    
    const newItems = [...orderedSecretariates];
    [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]];
    
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order_num: index + 1
    }));
    
    setOrderedSecretariates(updatedItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update each secretariate with their new order number
      const updatePromises = orderedSecretariates.map(async (person, index) => {
        const newOrderNum = index + 1;
        
        // Only update if the order number actually changed
        if (person.order_num !== newOrderNum) {
          const formData = new FormData();
          formData.append('name', person.name);
          formData.append('title', person.title);
          formData.append('description', person.description || '');
          formData.append('order_num', newOrderNum.toString());
          formData.append('pfp', person.pfp_url); // Keep existing image
          
          return updateSecretariate(person.id, formData);
        }
      });

      await Promise.all(updatePromises.filter(Boolean)); // Filter out undefined promises
      
      toast.success('Secretariat order updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    return orderedSecretariates.some((person, index) => {
      const originalPerson = secretariates.find(s => s.id === person.id);
      return originalPerson && originalPerson.order_num !== (index + 1);
    });
  };

  return (
    <div className="order-manager-overlay">
      <div className="order-manager-modal">
        <div className="order-manager-header">
          <h2>Reorder Secretariat</h2>
          <p>Drag and drop or use the arrow buttons to change the order</p>
          <button 
            onClick={onClose}
            className="x-btn"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <div className="order-manager-content">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedSecretariates.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="sortable-list">
                {orderedSecretariates.map((person, index) => (
                  <SortableSecretariateItem
                    key={person.id}
                    person={person}
                    index={index}
                    totalCount={orderedSecretariates.length}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="order-manager-footer">
          <div className="footer-info">
            {hasChanges() ? (
              <span className="changes-indicator">
                <Check size={16} />
                Changes detected
              </span>
            ) : (
              <span className="no-changes">No changes</span>
            )}
          </div>
          <div className="footer-buttons">
            <button 
              onClick={onClose}
              className="btn-secondary"
              type="button"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges() || isSaving}
              className="btn-primary"
              type="button"
            >
              {isSaving ? (
                <>
                  <div className="spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretariateOrderManager;
