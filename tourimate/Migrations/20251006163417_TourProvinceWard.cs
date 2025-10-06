using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class TourProvinceWard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0d2474a5-d4c4-4be0-b509-bf3780dac890"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("2de2d542-cb1f-48e0-9765-2ed2dbb89ed0"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("331cdded-b83b-4d76-b99d-7b8d83f65d74"));

            migrationBuilder.AddColumn<int>(
                name: "ProvinceCode",
                table: "Tours",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WardCode",
                table: "Tours",
                type: "int",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "ProvinceCode",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "WardCode",
                table: "Tours");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9119), new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9120) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9127), new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9127) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9133), new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9134) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0d2474a5-d4c4-4be0-b509-bf3780dac890"), "Finance", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9624), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9624), "0.15" },
                    { new Guid("2de2d542-cb1f-48e0-9765-2ed2dbb89ed0"), "Security", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9627), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9628), "5" },
                    { new Guid("331cdded-b83b-4d76-b99d-7b8d83f65d74"), "Finance", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9619), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9620), "0.15" }
                });
        }
    }
}
