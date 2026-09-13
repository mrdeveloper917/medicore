exports.calculateExperience = (experienceDetails = []) => {

    let totalMonths = 0;

    experienceDetails.forEach(item => {

        const start = new Date(item.startDate);

        const end = item.current
            ? new Date()
            : new Date(item.endDate);

        const months =
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());

        totalMonths += Math.max(months, 0);

    });

    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12
    };

};