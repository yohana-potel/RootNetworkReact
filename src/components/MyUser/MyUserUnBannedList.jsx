import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import { ImSpinner3 } from 'react-icons/im';
import '../../styles/Global.css';

const NonAdminUserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Función para obtener los usuarios no administradores
    const fetchNonAdminUsers = async () => {
        try {
            const response = await fetch('http://localhost:5156/User/non-admin?page=1&pageSize=5');
            const data = await response.json();

            if (data.data) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Error al cargar los usuarios no administradores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNonAdminUsers();
    }, []);

    const banUser = (userId) => {
        fetch(`http://localhost:5156/UserBan/ban/${userId}`, {
            method: 'PUT',
            headers: {
                'Accept': '*/*',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Eliminamos al usuario de la lista de usuarios no administradores
                setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            } else {
                console.error("Error al banear:", data.message);
            }
        })
        .catch(error => {
            console.error("Error al banear:", error);
        });
    };

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Lista de Usuarios No Administradores</h1>

            {loading ? (
                <div className="text-center">
                    <ImSpinner3 size={40} className="text-primary spin-animation" />
                    <p>Cargando usuarios no administradores...</p>
                </div>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.name || 'Desconocido'}</td>
                                    <td>{user.lastName || 'Desconocido'}</td>
                                    <td>
                                        <Button onClick={() => banUser(user.id)}>
                                            Banear
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">
                                    No hay usuarios no administradores.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default NonAdminUserList;
