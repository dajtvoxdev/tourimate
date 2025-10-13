using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "City",
                table: "UserProfiles");

            migrationBuilder.AddColumn<int>(
                name: "ProvinceCode",
                table: "UserProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WardCode",
                table: "UserProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5336), new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5336) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5341), new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5341) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5344), new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5345) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("a010ccd4-fc2b-41bd-b664-ca4d89f65179"), "Finance", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5519), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5520), "0.15" },
                    { new Guid("d845e6b1-0e92-4fbc-abed-efdfdf5c7185"), "Security", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5542), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5542), "5" },
                    { new Guid("fa167024-0044-45d2-9100-da9e0f509ac3"), "Finance", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5538), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 13, 4, 35, 12, 686, DateTimeKind.Utc).AddTicks(5538), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a010ccd4-fc2b-41bd-b664-ca4d89f65179"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("d845e6b1-0e92-4fbc-abed-efdfdf5c7185"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("fa167024-0044-45d2-9100-da9e0f509ac3"));

            migrationBuilder.DropColumn(
                name: "ProvinceCode",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WardCode",
                table: "UserProfiles");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "UserProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

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
    }
}
