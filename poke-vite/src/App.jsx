import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

const ITEMS_PER_PAGE = 20; // Paginación de 20 Pokémon por página [cite: 10]

function App() {
  const [allPokemons, setAllPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // URL base: obtener todos los Pokémon para manejo local
  const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon?limit=1292';

  // ----------------------------------------------------
  // DEFINICIÓN DE FUNCIONES DE NOTIFICACIÓN (CORREGIDA: DENTRO DEL COMPONENTE)
  // ----------------------------------------------------

  const solicitarPermisoNotificaciones = () => {
    // Verifica que la API de Notificaciones exista en la ventana [cite: 57]
    if ("Notification" in window) {
      Notification.requestPermission().then(resultado => {
        console.log("Permiso de notificación:", resultado);
        if (resultado === "granted") {
          new Notification("PokéPWA", { body: "¡Notificaciones activadas!" });
        }
      });
    }
  };

  const enviarNotificacion = async (pokemonName) => {
    // 1. Verificar si el navegador soporta Service Workers [cite: 62]
    if ("serviceWorker" in navigator) {
      try {
        // 2. Esperar a que el Service Worker esté listo [cite: 62]
        const registration = await navigator.serviceWorker.ready;

        // 3. Enviar el mensaje al Service Worker [cite: 62]
        registration.active.postMessage({
          type: "SHOW_NOTIFICATION",
          payload: {
            title: `¡${pokemonName} consultado!`,
            body: `Has visto a ${pokemonName}. ¡Consulta más ahora!`,
          }
        });
        console.log("Mensaje enviado al Service Worker.");

      } catch (error) {
        console.error("Error al enviar el mensaje al Service Worker:", error);
      }
    }
  };

  // ----------------------------------------------------
  // LÓGICA DE CARGA DE DATOS (useEffect)
  // ----------------------------------------------------
  useEffect(() => {
    async function fetchAllPokemon() {
      try {
        const response = await fetch(POKEAPI_BASE_URL);
        if (!response.ok) throw new Error('Error al obtener la lista de Pokémon.');
        const data = await response.json();
        const results = data.results;

        const pokemonDetailPromises = results.map(async (pokemon) => {
          const urlParts = pokemon.url.split('/');
          const id = urlParts[urlParts.length - 2];
          return {
            id: parseInt(id),
            name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`, // [cite: 13]
          };
        });

        const detailedPokemons = await Promise.all(pokemonDetailPromises);
        setAllPokemons(detailedPokemons);
        setLoading(false);

      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchAllPokemon();
  }, []);

  // ----------------------------------------------------
  // LÓGICA DEL BUSCADOR Y PAGINACIÓN
  // ----------------------------------------------------
  const filteredPokemons = useMemo(() => {
    return allPokemons.filter(pokemon =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allPokemons, searchTerm]);

  const totalPages = Math.ceil(filteredPokemons.length / ITEMS_PER_PAGE);
  const paginatedPokemons = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPokemons.slice(startIndex, endIndex);
  }, [filteredPokemons, currentPage]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  // ----------------------------------------------------

  if (loading) {
    return <h1>Cargando Pokémon...</h1>;
  }

  if (error) {
    return <h1>Error: {error}</h1>;
  }

  return (
    <div className="App">
      <h1> Pokédex Progresiva</h1>

      {/* --- Buscador --- */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar Pokémon por nombre..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        <span className="search-icon">
        </span>
      </div>

      {/* Botón para pedir permiso [cite: 58] */}
      <button
        onClick={solicitarPermisoNotificaciones}
        className="btn-notificaciones"
      >
        Activar Notificaciones
      </button>

      {/* --- Lista de Pokémon --- */}
      <div className="pokemon-list">
        {paginatedPokemons.map((p) => (
          <div
            className="pokemon-card"
            key={p.id}
            // Al hacer click, envía el mensaje al Service Worker
            onClick={() => enviarNotificacion(p.name)}
          >
            <p className="pokemon-id">#{p.id}</p>
            <img src={p.image} alt={p.name} className="pokemon-image" />
            <h2 className="pokemon-name">{p.name}</h2>
          </div>
        ))}
      </div>

      {/* --- Paginación --- */}
      {filteredPokemons.length > ITEMS_PER_PAGE && (
        <div className="pagination">
          <button onClick={goToPrevPage} disabled={currentPage === 1}>
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button onClick={goToNextPage} disabled={currentPage === totalPages}>
            Siguiente
          </button>
        </div>
      )}
      {filteredPokemons.length === 0 && (
        <p>No se encontraron Pokémon con ese nombre.</p>
      )}

    </div>
  );
}

export default App;