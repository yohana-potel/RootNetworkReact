import React, { useState, useEffect, useCallback } from 'react';
import { Table, Modal, Button, Form } from 'react-bootstrap';
import { ImSpinner3 } from 'react-icons/im';
import '../../styles/Global.css';

// Componente principal MyUser
const MyUser = () => {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [bannedUsers, setBannedUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [banReason, setBanReason] = useState("");
    const [banEndDate, setBanEndDate] = useState("");

    // Obtener lista de usuarios no administradores
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(`http://localhost:5156/User?query=${encodedQuery}&page=${page}&pageSize=5&isAdmin=false`);
            if (!response.ok) throw new Error('Error fetching non-admin users');
            const data = await response.json();

            setUsers(data.data || data);  
        } catch (error) {
            console.error('Error fetching non-admin users:', error);
        } finally {
            setLoading(false);
        }
    }, [query, page]);

    // Obtener lista de usuarios baneados
    const fetchBannedUsers = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5156/UserBan?page=1&pageSize=5');
            if (!response.ok) throw new Error('Error fetching banned users');

            const data = await response.json();

            // Obtener detalles de cada usuario baneado
            const usersWithDetails = await Promise.all(
                data.data.map(async (ban) => {
                    try {
                        const userResponse = await fetch(`http://localhost:5156/User/${ban.userId}`);
                        if (!userResponse.ok) throw new Error(`Error fetching user ${ban.userId}`);

                        const userData = await userResponse.json();
                        return { ...ban, ...userData };
                    } catch (err) {
                        console.error(`No se pudo obtener detalles del usuario ${ban.userId}:`, err);
                        return { ...ban, name: "Desconocido", lastName: "", mail: "" };
                    }
                })
            );

            setBannedUsers(usersWithDetails);
        } catch (error) {
            console.error('Error fetching banned users:', error);
        }
    }, []);

   
    const filteredUsers = users.filter(user => !bannedUsers.some(banned => banned.userId === user.id));

   
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchBannedUsers();
    }, [fetchBannedUsers]);

   
    const openBanModal = (userId) => {
        setSelectedUserId(userId);
        setShowModal(true);
    };


    const closeBanModal = () => {
        setShowModal(false);
        setSelectedUserId(null);
        setBanReason("");
        setBanEndDate("");
    };

    
    const banUser = async () => {
        const requestBody = {
            StartDateTime: new Date().toISOString(),
            EndDateTime: banEndDate || null,
            Reason: banReason || "Violación de términos"
        };

        try {
            const response = await fetch(`http://localhost:5156/UserBan/ban/${selectedUserId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al banear el usuario: ${errorText}`);
            }

            console.log(`Usuario ${selectedUserId} baneado con éxito`);

            
            setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUserId));

       
            const bannedUser = users.find(user => user.id === selectedUserId);
            if (bannedUser) {
                setBannedUsers(prevBanned => [...prevBanned, { ...bannedUser, userId: selectedUserId }]);
            }

     
            await fetchUsers();
            await fetchBannedUsers();

           
            closeBanModal();

        } catch (error) {
            console.error("Error al banear:", error);
        }
    };

    return (
        <div className="user-list-container">
            <div className="search-container">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar usuario no administrador"
                    className="search-input"
                />
                <button onClick={() => setPage(1)} className="btn-search">Buscar</button>
            </div>

            {loading ? (
                <div className="spinner"><ImSpinner3 /></div>
            ) : (
                <div className="table-container">
                    <Table striped bordered hover className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Email</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user, index) => (
                                    <tr key={user.id}>
                                        <td>{index + 1}</td>
                                        <td>{user.name}</td>
                                        <td>{user.lastName}</td>
                                        <td>{user.mail}</td>
                                        <td>
                                            <button onClick={() => openBanModal(user.id)} className="btn-ban">Banear</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5">No hay usuarios no administradores.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}

            <div className="nav-buttons">
                <button className="btn-new" onClick={() => setPage(prev => prev - 1)} disabled={page === 1}>Anterior</button>
                <p>{page}</p>
                <button className="btn-new" onClick={() => setPage(prev => prev + 1)}>Siguiente</button>
            </div>

           {/* Modal para banear usuario */}
            <Modal show={showModal} onHide={closeBanModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Banear Usuario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="banReason">
                            <Form.Label>Motivo del baneo</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Escribe el motivo"
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="banEndDate">
                            <Form.Label>Fecha de fin del baneo</Form.Label>
                            <Form.Control
                                type="date"
                                value={banEndDate}
                                onChange={(e) => setBanEndDate(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeBanModal} className="btn-ban">
                        Cancelar
                    </Button>
                    <Button onClick={banUser} className="btn-ban">
                        Confirmar Baneo
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default MyUser;
