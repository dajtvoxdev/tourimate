using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTourDifficulty1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "Tours");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6190), new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6190) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6194), new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6195) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6198), new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6198) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("03b440bd-4e24-406b-ae18-ea08a7326ebf"), "Finance", new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6375), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6375), "0.15" },
                    { new Guid("2e6202aa-0b65-4a73-88df-e48cf3f9820b"), "Finance", new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6392), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6393), "0.15" },
                    { new Guid("ce73d9a1-e0cd-4dec-890f-37127084007f"), "Security", new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6396), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 7, 7, 53, 6, 807, DateTimeKind.Utc).AddTicks(6396), "5" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("03b440bd-4e24-406b-ae18-ea08a7326ebf"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("2e6202aa-0b65-4a73-88df-e48cf3f9820b"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("ce73d9a1-e0cd-4dec-890f-37127084007f"));

            migrationBuilder.AddColumn<string>(
                name: "Difficulty",
                table: "Tours",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

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
    }
}
