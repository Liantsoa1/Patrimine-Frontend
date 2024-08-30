import React, { useState } from 'react';
import axios from 'axios';

const PatrimoineRange = () => {
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [jour, setJour] = useState(''); // Gardez le jour pour la logique, mais pas pour l'affichage
    const [valeurPatrimoine, setValeurPatrimoine] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const response = await axios.post('http://localhost:5000/patrimoine/range', {
                dateDebut,
                dateFin,
                jour
            });
    
            // Assurez-vous que vous mettez à jour l'état avec la valeur calculée
            const valeurs = response.data; // Supposons que la réponse est un tableau d'objets avec des valeurs
            const totalValeur = valeurs.reduce((acc, item) => acc + item.valeur, 0);
            setValeurPatrimoine(totalValeur); // Mettre à jour l'état avec la somme des valeurs
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
        }
    };

    return (
        <div>
            <h2>Valeur du patrimoine sur une plage de dates</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Date de début :
                    <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
                </label>
                <label>
                    Date de fin :
                    <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
                </label>
                <label>
                    Jour de la semaine :
                    <select value={jour} onChange={(e) => setJour(e.target.value)}>
                        <option value="">Sélectionnez un jour</option>
                        <option value="0">Dimanche</option>
                        <option value="1">Lundi</option>
                        <option value="2">Mardi</option>
                        <option value="3">Mercredi</option>
                        <option value="4">Jeudi</option>
                        <option value="5">Vendredi</option>
                        <option value="6">Samedi</option>
                    </select>
                </label>
                <button type="submit">Calculer</button>
            </form>
            <p>Valeur du patrimoine : {valeurPatrimoine} Ar</p>
        </div>
    );
};

export default PatrimoineRange;