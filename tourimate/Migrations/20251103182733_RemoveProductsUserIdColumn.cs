using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveProductsUserIdColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key if it exists (using SQL to check)
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Products_Users_UserId')
                BEGIN
                    ALTER TABLE [Products] DROP CONSTRAINT [FK_Products_Users_UserId];
                END
            ");

            // Drop index if it exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_UserId' AND object_id = OBJECT_ID('Products'))
                BEGIN
                    DROP INDEX [IX_Products_UserId] ON [Products];
                END
            ");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("abc291dc-e966-41d1-84d6-667803af34bb"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("af4e0b5c-e302-49df-8a65-c5e227412784"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("b51d4859-fafc-4f33-a7d9-b755c41edbae"));

            // Drop column if it exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE name = 'UserId' AND object_id = OBJECT_ID('Products'))
                BEGIN
                    DECLARE @var0 sysname;
                    SELECT @var0 = [d].[name]
                    FROM [sys].[default_constraints] [d]
                    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
                    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Products]') AND [c].[name] = N'UserId');
                    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Products] DROP CONSTRAINT [' + @var0 + '];');
                    ALTER TABLE [Products] DROP COLUMN [UserId];
                END
            ");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9905), new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9906) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9910), new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9910) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9914), new DateTime(2025, 11, 3, 18, 27, 33, 70, DateTimeKind.Utc).AddTicks(9914) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("03dfefa0-023f-477b-84d3-35375806a58d"), "Finance", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(230), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(231), "0.15" },
                    { new Guid("0dbbc1a0-d848-4a1e-a76d-8a0e5e7d2e02"), "Security", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(234), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(234), "5" },
                    { new Guid("69f5fef8-78c3-4988-8c5d-76fd882638f5"), "Finance", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(207), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 18, 27, 33, 71, DateTimeKind.Utc).AddTicks(208), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("03dfefa0-023f-477b-84d3-35375806a58d"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0dbbc1a0-d848-4a1e-a76d-8a0e5e7d2e02"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("69f5fef8-78c3-4988-8c5d-76fd882638f5"));

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Products",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_UserId",
                table: "Products",
                column: "UserId");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(3980), new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(3982) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4021), new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4022) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4025), new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4025) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("abc291dc-e966-41d1-84d6-667803af34bb"), "Security", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4373), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4373), "5" },
                    { new Guid("af4e0b5c-e302-49df-8a65-c5e227412784"), "Finance", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4369), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4370), "0.15" },
                    { new Guid("b51d4859-fafc-4f33-a7d9-b755c41edbae"), "Finance", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4344), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4344), "0.15" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_UserId",
                table: "Products",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
