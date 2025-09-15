export const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const formatTime = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '--:--';
    }
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatDisplayDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Not Set';
    }
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};