using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTourDifficulty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0e8bb227-8418-4fdf-be26-19c968ef9682"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("8cac5bdc-0011-4e72-a403-92ec9d44b266"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("8e092e40-8154-4674-9e3f-6c1e19d9872e"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(5906), new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(5906) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(5911), new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(5911) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(5915), new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(5915) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("46d1237f-e7a3-40d0-bcfa-bfcccd0d916a"), "Finance", new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(6240), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(6240), "0.15" },
                    { new Guid("a2c9ef58-6e91-4f09-a654-ab30e15725ea"), "Security", new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(6257), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(6258), "5" },
                    { new Guid("e20bd12b-7c03-475d-a86b-188ea8bd5013"), "Finance", new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(6235), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 7, 7, 22, 20, 169, DateTimeKind.Utc).AddTicks(6236), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("46d1237f-e7a3-40d0-bcfa-bfcccd0d916a"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a2c9ef58-6e91-4f09-a654-ab30e15725ea"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e20bd12b-7c03-475d-a86b-188ea8bd5013"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5043), new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5044) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5050), new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5051) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5055), new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5055) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0e8bb227-8418-4fdf-be26-19c968ef9682"), "Security", new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5397), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5397), "5" },
                    { new Guid("8cac5bdc-0011-4e72-a403-92ec9d44b266"), "Finance", new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5377), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5377), "0.15" },
                    { new Guid("8e092e40-8154-4674-9e3f-6c1e19d9872e"), "Finance", new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5392), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 6, 16, 34, 15, 732, DateTimeKind.Utc).AddTicks(5392), "0.15" }
                });
        }
    }
}
