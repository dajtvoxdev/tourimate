using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionDirectionToTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("28d79857-b746-4cc8-9140-e4b1abf45afa"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("432fdaf8-c3ac-44cd-808f-df6b2bc7b97d"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("b4c8782b-bef1-4ad2-89ce-066c8351de14"));

            migrationBuilder.AddColumn<string>(
                name: "TransactionDirection",
                table: "Transactions",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2207), new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2208) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2213), new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2214) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2217), new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2217) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("37b365ce-3b32-4b19-9144-31ab46f8d893"), "Security", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2456), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2457), "5" },
                    { new Guid("74e8a44b-d841-4b46-9c45-ab241acd08a5"), "Finance", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2439), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2439), "0.15" },
                    { new Guid("e9b63921-b5c3-4ddb-a64a-12c79811adec"), "Finance", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2453), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2453), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("37b365ce-3b32-4b19-9144-31ab46f8d893"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("74e8a44b-d841-4b46-9c45-ab241acd08a5"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e9b63921-b5c3-4ddb-a64a-12c79811adec"));

            migrationBuilder.DropColumn(
                name: "TransactionDirection",
                table: "Transactions");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1174), new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1175) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1179), new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1179) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1183), new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1183) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("28d79857-b746-4cc8-9140-e4b1abf45afa"), "Finance", new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1433), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1433), "0.15" },
                    { new Guid("432fdaf8-c3ac-44cd-808f-df6b2bc7b97d"), "Finance", new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1415), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1415), "0.15" },
                    { new Guid("b4c8782b-bef1-4ad2-89ce-066c8351de14"), "Security", new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1436), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 28, 4, 50, 47, 948, DateTimeKind.Utc).AddTicks(1436), "5" }
                });
        }
    }
}
