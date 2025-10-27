using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class SetDefaultTourRatingTo4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0c5ed87a-823c-4bf4-a64f-f10dcefd26d9"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("ac580afe-32b6-4723-a587-47b2869fee7f"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("c1b7d1a5-19fc-4580-a53b-8493484add65"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(2856), new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(2857) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(2862), new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(2863) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(2866), new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(2866) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("b45ad8ca-e88e-47a1-9b6e-48b8d5cf7466"), "Security", new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(3108), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(3108), "5" },
                    { new Guid("eb25446a-ac23-4a48-80ba-af2379acf84c"), "Finance", new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(3100), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(3101), "0.15" },
                    { new Guid("ffb2bddc-4c2b-410e-82a8-0ee356c239c7"), "Finance", new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(3096), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 27, 3, 46, 31, 938, DateTimeKind.Utc).AddTicks(3097), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("b45ad8ca-e88e-47a1-9b6e-48b8d5cf7466"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("eb25446a-ac23-4a48-80ba-af2379acf84c"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("ffb2bddc-4c2b-410e-82a8-0ee356c239c7"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(799), new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(799) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(816), new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(817) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(820), new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(820) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0c5ed87a-823c-4bf4-a64f-f10dcefd26d9"), "Security", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1151), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1151), "5" },
                    { new Guid("ac580afe-32b6-4723-a587-47b2869fee7f"), "Finance", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1143), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1144), "0.15" },
                    { new Guid("c1b7d1a5-19fc-4580-a53b-8493484add65"), "Finance", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1147), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1147), "0.15" }
                });
        }
    }
}
