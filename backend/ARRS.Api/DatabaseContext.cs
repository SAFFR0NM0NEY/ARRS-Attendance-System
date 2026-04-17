// =============================================================================
// FILE:    Data/DatabaseContext.cs
// OWNER:   Thandeka (Attendance Engine & API Lead)
// PURPOSE: Central database connection manager.
//          All services receive this via constructor injection.
//          Uses ADO.NET with raw SQL — no Entity Framework, full control.
// =============================================================================

using System;
using System.Data;
using Microsoft.Data.SqlClient;

namespace AttendanceSystem.Data
{
    public class DatabaseContext : IDisposable
    {
        private readonly string _connectionString;
        private SqlConnection   _connection;

        // -------------------------------------------------------------------------
        // CONSTRUCTOR
        // Receives the connection string from Program.cs (or appsettings.json).
        // Example:
        //   "Server=localhost;Database=AttendanceDB;User Id=sa;Password=Pass123;
        //    TrustServerCertificate=True;"
        // -------------------------------------------------------------------------
        public DatabaseContext(string connectionString)
        {
            _connectionString = connectionString
                ?? throw new ArgumentNullException(nameof(connectionString));
        }

        // -------------------------------------------------------------------------
        // METHOD: GetConnection()
        // Returns an open SqlConnection.
        // Lazily creates and opens it on first call.
        // -------------------------------------------------------------------------
        public SqlConnection GetConnection()
        {
            if (_connection == null)
                _connection = new SqlConnection(_connectionString);

            if (_connection.State != ConnectionState.Open)
                _connection.Open();

            return _connection;
        }

        // -------------------------------------------------------------------------
        // METHOD: Dispose()
        // Always close the connection when the using block ends.
        // -------------------------------------------------------------------------
        public void Dispose()
        {
            if (_connection?.State == ConnectionState.Open)
                _connection.Close();

            _connection?.Dispose();
        }
    }
}
